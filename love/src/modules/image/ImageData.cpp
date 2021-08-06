/**
 * Copyright (c) 2006-2018 LOVE Development Team
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 **/

#include "ImageData.h"
#include "Image.h"
#include "filesystem/Filesystem.h"
#include <queue>
#include <map>
#include <set>
#include <math.h>

using love::thread::Lock;

namespace love
{
namespace image
{

love::Type ImageData::type("ImageData", &Data::type);

ImageData::ImageData(Data *data)
{
	decode(data);
}

ImageData::ImageData(int width, int height, PixelFormat format)
{
	if (!validPixelFormat(format))
		throw love::Exception("Unsupported pixel format for ImageData");

	this->width = width;
	this->height = height;
	this->format = format;

	create(width, height, format);

	// Set to black/transparency.
	memset(data, 0, getSize());
}

ImageData::ImageData(int width, int height, PixelFormat format, void *data, bool own)
{
	if (!validPixelFormat(format))
		throw love::Exception("Unsupported pixel format for ImageData");

	this->width = width;
	this->height = height;
	this->format = format;

	if (own)
		this->data = (unsigned char *) data;
	else
		create(width, height, format, data);
}

ImageData::ImageData(const ImageData &c)
{
	width = c.width;
	height = c.height;
	format = c.format;

	create(width, height, format, c.getData());
}

ImageData::~ImageData()
{
	if (decodeHandler.get())
		decodeHandler->freeRawPixels(data);
	else
		delete[] data;
}

love::image::ImageData *ImageData::clone() const
{
	return new ImageData(*this);
}

void ImageData::create(int width, int height, PixelFormat format, void *data)
{
	size_t datasize = width * height * getPixelFormatSize(format);

	try
	{
		this->data = new unsigned char[datasize];
	}
	catch(std::bad_alloc &)
	{
		throw love::Exception("Out of memory");
	}

	if (data)
		memcpy(this->data, data, datasize);

	decodeHandler = nullptr;
	this->format = format;
}

void ImageData::decode(Data *data)
{
	FormatHandler *decoder = nullptr;
	FormatHandler::DecodedImage decodedimage;

	auto module = Module::getInstance<Image>(Module::M_IMAGE);

	if (module == nullptr)
		throw love::Exception("love.image must be loaded in order to decode an ImageData.");

	for (FormatHandler *handler : module->getFormatHandlers())
	{
		if (handler->canDecode(data))
		{
			decoder = handler;
			break;
		}
	}

	if (decoder)
		decodedimage = decoder->decode(data);

	if (decodedimage.data == nullptr)
	{
		auto filedata = dynamic_cast<filesystem::FileData *>(data);

		if (filedata != nullptr)
		{
			const std::string &name = filedata->getFilename();
			throw love::Exception("Could not decode file '%s' to ImageData: unsupported file format", name.c_str());
		}
		else
			throw love::Exception("Could not decode data to ImageData: unsupported encoded format");
	}

	if (decodedimage.size != decodedimage.width * decodedimage.height * getPixelFormatSize(decodedimage.format))
	{
		decoder->freeRawPixels(decodedimage.data);
		throw love::Exception("Could not convert image!");
	}

	// Clean up any old data.
	if (decodeHandler)
		decodeHandler->freeRawPixels(this->data);
	else
		delete[] this->data;

	this->width  = decodedimage.width;
	this->height = decodedimage.height;
	this->data   = decodedimage.data;
	this->format = decodedimage.format;

	decodeHandler = decoder;
}

love::filesystem::FileData *ImageData::encode(FormatHandler::EncodedFormat encodedFormat, const char *filename, bool writefile) const
{
	FormatHandler *encoder = nullptr;
	FormatHandler::EncodedImage encodedimage;
	FormatHandler::DecodedImage rawimage;

	rawimage.width = width;
	rawimage.height = height;
	rawimage.size = getSize();
	rawimage.data = data;
	rawimage.format = format;

	auto module = Module::getInstance<Image>(Module::M_IMAGE);

	if (module == nullptr)
		throw love::Exception("love.image must be loaded in order to encode an ImageData.");

	for (FormatHandler *handler : module->getFormatHandlers())
	{
		if (handler->canEncode(format, encodedFormat))
		{
			encoder = handler;
			break;
		}
	}

	if (encoder != nullptr)
	{
		thread::Lock lock(mutex);
		encodedimage = encoder->encode(rawimage, encodedFormat);
	}

	if (encoder == nullptr || encodedimage.data == nullptr)
	{
		const char *fname = "unknown";
		love::getConstant(format, fname);
		throw love::Exception("No suitable image encoder for %s format.", fname);
	}

	love::filesystem::FileData *filedata = nullptr;

	try
	{
		filedata = new love::filesystem::FileData(encodedimage.size, filename);
	}
	catch (love::Exception &)
	{
		encoder->freeRawPixels(encodedimage.data);
		throw;
	}

	memcpy(filedata->getData(), encodedimage.data, encodedimage.size);
	encoder->freeRawPixels(encodedimage.data);

	if (writefile)
	{
		auto fs = Module::getInstance<filesystem::Filesystem>(Module::M_FILESYSTEM);

		if (fs == nullptr)
		{
			filedata->release();
			throw love::Exception("love.filesystem must be loaded in order to write an encoded ImageData to a file.");
		}

		try
		{
			fs->write(filename, filedata->getData(), filedata->getSize());
		}
		catch (love::Exception &)
		{
			filedata->release();
			throw;
		}
	}

	return filedata;
}

size_t ImageData::getSize() const
{
	return size_t(getWidth() * getHeight()) * getPixelSize();
}

void *ImageData::getData() const
{
	return data;
}

bool ImageData::isSRGB() const
{
	return false;
}

bool ImageData::inside(int x, int y) const
{
	return x >= 0 && x < getWidth() && y >= 0 && y < getHeight();
}

void ImageData::setPixel(int x, int y, const Pixel &p)
{
	if (!inside(x, y))
		throw love::Exception("Attempt to set out-of-range pixel!");

	size_t pixelsize = getPixelSize();
	unsigned char *pixeldata = data + ((y * width + x) * pixelsize);

	Lock lock(mutex);
	memcpy(pixeldata, &p, pixelsize);
}

void ImageData::getPixel(int x, int y, Pixel &p) const
{
	if (!inside(x, y))
		throw love::Exception("Attempt to get out-of-range pixel!");

	size_t pixelsize = getPixelSize();

	Lock lock(mutex);
	memcpy(&p, data + ((y * width + x) * pixelsize), pixelsize);
}

struct flood_pixel_t {
	int x;
	int y;
};

bool ImageData::isAlphaSet(const Pixel &p)
{
	switch (format)
		{
		case PIXELFORMAT_RGBA8:
			return p.rgba8[3] > 0;
		case PIXELFORMAT_RGBA16:
			return p.rgba16[3] > 0;
		case PIXELFORMAT_RGBA16F:
			return p.rgba16f[3] > 0.0;
		case PIXELFORMAT_RGBA32F:
			return p.rgba32f[3] > 0.0;
		default:
			return true;
		}
}

void ImageData::clearPixel(Pixel &p)
{
	switch (format)
		{
		case PIXELFORMAT_RGBA8:
			for (int i = 0; i < 4; i++) {
				p.rgba8[i] = 0;
			}
			return;
		case PIXELFORMAT_RGBA16:
			for (int i = 0; i < 4; i++) {
				p.rgba16[i] = 0;
			}
			return;
		case PIXELFORMAT_RGBA16F:
			for (int i = 0; i < 4; i++) {
				p.rgba16f[i] = 0.0;
			}
			return;
		case PIXELFORMAT_RGBA32F:
			for (int i = 0; i < 4; i++) {
				p.rgba32f[i] = 0.0;
			}
			return;
		default:
			return;
		}
}

int ImageData::getPixelHash(const Pixel &p)
{
	int result = 0;

	switch (format)
		{
		case PIXELFORMAT_RGBA8:
			for (int i = 0; i < 4; i++) {
				result += p.rgba8[i];
				//result *= 1000;
			}
			break;
		case PIXELFORMAT_RGBA16:
			for (int i = 0; i < 4; i++) {
				result += p.rgba16[i];
				//result *= 1000;
			}
			break;
		case PIXELFORMAT_RGBA16F:
			for (int i = 0; i < 4; i++) {
				result += p.rgba16f[i];
				//result *= 1000;
			}
			break;
		case PIXELFORMAT_RGBA32F:
			for (int i = 0; i < 4; i++) {
				result += p.rgba32f[i];
				//result *= 1000;
			}
			break;
		}


	return result;
}

bool ImageData::arePixelsEqual(const Pixel &p1, const Pixel &p2)
{
	switch (format)
		{
		case PIXELFORMAT_RGBA8:
			for (int i = 0; i < 4; i++) {
				if (p1.rgba8[i] != p2.rgba8[i]) {
					return false;
				}
			}
			return true;
		case PIXELFORMAT_RGBA16:
			for (int i = 0; i < 4; i++) {
				if (p1.rgba16[i] != p2.rgba16[i]) {
					return false;
				}
			}
			return true;
		case PIXELFORMAT_RGBA16F:
			for (int i = 0; i < 4; i++) {
				if (p1.rgba16f[i] != p2.rgba16f[i]) {
					return false;
				}
			}
			return true;
		case PIXELFORMAT_RGBA32F:
			for (int i = 0; i < 4; i++) {
				if (p1.rgba32f[i] != p2.rgba32f[i]) {
					return false;
				}
			}
			return true;
		default:
			return true;
		}
}

bool ImageData::isEmpty()
{
	Pixel p;

	for (int x = 0; x < width; x++) {
		for (int y = 0; y < height; y++) {
			getPixel(x, y, p);
			if (isAlphaSet(p)) {
				return false;
			}
		}
	}
	
	return true;
}

void ImageData::getBounds(int * result)
{
	// top left x, top left y, bottom right x, bottom right y
	for (int i = 0; i < 4; i++) {
		result[i] = -1;
	}
	
	Pixel p;

	for (int x = 0; x < width; x++) {
		for (int y = 0; y < height; y++) {
			getPixel(x, y, p);
			if (isAlphaSet(p)) {
				if (result[0] == -1 || x < result[0]) {
					result[0] = x;
				}
				
				if (result[1] == -1 || y < result[1]) {
					result[1] = y;
				}
				
				if (result[2] == -1 || x > result[2]) {
					result[2] = x;
				}
				
				if (result[3] == -1 || y > result[3]) {
					result[3] = y;
				}
			}
		}
	}
}

// destX and destY can be negative. sourceX + sourceWidth and sourceY + sourceHeight can be greater than the dest size also
// would be faster to memcpy entire rows but is tricky with all the potential out of bounds errors
void ImageData::copyImageData(ImageData * sourceImageData, int sourceX, int sourceY, int sourceWidth, int sourceHeight, int destX, int destY)
{
	Lock lock(mutex);
	Lock lock2(sourceImageData->mutex);
	
	int sourceActualWidth = sourceImageData->getWidth();
	int sourceActualHeight = sourceImageData->getHeight();
	int currentDestY = destY;
	
	size_t pixelsize = getPixelSize();
	
	for (int y = sourceY; y < sourceY + sourceHeight; y++) {
		int currentDestX = destX;

		for (int x = sourceX; x < sourceX + sourceWidth; x++) {
			if (x >= 0 && x < sourceActualWidth &&
				y >= 0 && y < sourceActualHeight &&
				currentDestX >= 0 && currentDestX < width &&
				currentDestY >= 0 && currentDestY < height) {
				
				unsigned char *sourcePixel = sourceImageData->data + ((y * sourceActualWidth + x) * pixelsize);
				unsigned char *destPixel = data + ((currentDestY * width + currentDestX) * pixelsize);
				memcpy(destPixel, sourcePixel, pixelsize);
			}
			
			currentDestX++;
		}

		currentDestY++;
	}
}

int ImageData::floodFillTest(int x, int y, ImageData *paths, const Pixel &p)
{
	Pixel floodP;
	getPixel(x, y, floodP);
	if (arePixelsEqual(floodP, p)) {
		return 1;
	}

	Pixel pathP;
	paths->getPixel(x, y, pathP);
	if (paths->isAlphaSet(pathP)) {
		return 2;
	}

	return 0;
}

int ImageData::floodFill(int x, int y, ImageData *paths, const Pixel &p)
{
	if (!inside(x, y)) {
		return 0;
	}
	
	int result = internalFloodFill(x, y, paths, p);
	if (result == -1) {
		Pixel clearP;
		clearPixel(clearP);
		internalFloodFill(x, y, paths, clearP);

		return 0;
	}

	return result;
}

int ImageData::floodFillErase(int x, int y, int radius, ImageData *paths)
{
	Pixel clearP;
	clearPixel(clearP);
	
	std::queue<flood_pixel_t> pixelQueue;
	
	for (int cy = -radius; cy <= radius; cy++) {
		float angle = asin((float) cy / (float) radius);
		float xdiff = abs(radius * cos(angle));
		
		for (int cx = -xdiff; cx <= xdiff; cx++) {
			int px = x + cx;
			int py = y + cy;
			if (inside(px, py)) {
				flood_pixel_t p;
				p.x = px;
				p.y = py;

				pixelQueue.push(p);
			}
		}
	}

	int count = 0;
	size_t pixelsize = getPixelSize();

	while (!pixelQueue.empty()) {
		flood_pixel_t currentPixel = pixelQueue.front();
		pixelQueue.pop();

		if (floodFillTest(currentPixel.x, currentPixel.y, paths, clearP) == 0) {
			unsigned char *pixeldata = data + ((currentPixel.y * width + currentPixel.x) * pixelsize);
			count++;
			memcpy(pixeldata, &clearP, pixelsize);

			for (int dx = -1; dx <= 1; dx++) {
				for (int dy = -1; dy <= 1; dy++) {
					bool skip = false;
					if (dx == 0 && dy == 0) {
						skip = true;
					}

					flood_pixel_t newPixel;
					newPixel.x = currentPixel.x + dx;
					newPixel.y = currentPixel.y + dy;

					if (!inside(newPixel.x, newPixel.y)) {
						return -1;
					}

					if (!skip) {
						int testResult = floodFillTest(newPixel.x, newPixel.y, paths, clearP);
						if (testResult == 0) {
							pixelQueue.push(newPixel);
						} else if (testResult == 2) {
							unsigned char *pixeldata = data + ((newPixel.y * width + newPixel.x) * pixelsize);
							count++;
							memcpy(pixeldata, &clearP, pixelsize);
						}
					}
				}
			}
		}
	}

	return count;
}

int ImageData::internalFloodFill(int x, int y, ImageData *paths, const Pixel &p)
{
	Lock lock(mutex);
	Lock lock2(paths->mutex);

	std::queue<flood_pixel_t> pixelQueue;
	flood_pixel_t startPixel;
	startPixel.x = x;
	startPixel.y = y;
	int count = 0;

	pixelQueue.push(startPixel);

	size_t pixelsize = getPixelSize();

	while (!pixelQueue.empty()) {
		flood_pixel_t currentPixel = pixelQueue.front();
		pixelQueue.pop();

		if (floodFillTest(currentPixel.x, currentPixel.y, paths, p) == 0) {
			unsigned char *pixeldata = data + ((currentPixel.y * width + currentPixel.x) * pixelsize);
			count++;
			memcpy(pixeldata, &p, pixelsize);

			for (int dx = -1; dx <= 1; dx++) {
				for (int dy = -1; dy <= 1; dy++) {
					bool skip = false;
					if (dx == 0 && dy == 0) {
						skip = true;
					}

					flood_pixel_t newPixel;
					newPixel.x = currentPixel.x + dx;
					newPixel.y = currentPixel.y + dy;

					if (!inside(newPixel.x, newPixel.y)) {
						return -1;
					}

					if (!skip) {
						int testResult = floodFillTest(newPixel.x, newPixel.y, paths, p);
						if (testResult == 0) {
							pixelQueue.push(newPixel);
						} else if (testResult == 2) {
							unsigned char *pixeldata = data + ((newPixel.y * width + newPixel.x) * pixelsize);
							count++;
							memcpy(pixeldata, &p, pixelsize);
						}
					}
				}
			}
		}
	}

	return count;
}

int ImageData::floodFillTest2(int x, int y, ImageData *paths, int* pixels)
{
	if (pixels[y * width + x] != 0) {
		return 1;
	}

	Pixel pathP;
	paths->getPixel(x, y, pathP);
	if (paths->isAlphaSet(pathP)) {
		return 2;
	}

	return 0;
}

void ImageData::updateFloodFillForNewPaths(ImageData *paths) {
	updateFloodFillForNewPaths(paths, 0);
}

void ImageData::updateFloodFillForNewPaths(ImageData *paths, int debug)
{
	Lock lock(mutex);
	Lock lock2(paths->mutex);
	
	int arrayLength = width * height;
	int* pixels = new int[arrayLength];
	for (int i = 0; i < arrayLength; i++) {
		pixels[i] = 0;
	}

	int regionNum = 1;
	std::set<int> regionsThatTouchBounds;

	for (int x = 0; x < width; x++) {
		for (int y = 0; y < height; y++) {
			int pixelIndex = y * width + x;

			if (pixels[pixelIndex] == 0) {
				int count = 0;
				std::queue<flood_pixel_t> pixelQueue;
				flood_pixel_t startPixel;
				startPixel.x = x;
				startPixel.y = y;

				pixelQueue.push(startPixel);

				while (!pixelQueue.empty()) {
					flood_pixel_t currentPixel = pixelQueue.front();
					pixelQueue.pop();

					if (floodFillTest2(currentPixel.x, currentPixel.y, paths, pixels) == 0) {
						pixels[(currentPixel.y * width + currentPixel.x)] = regionNum;
						count++;

						for (int dx = -1; dx <= 1; dx++) {
							for (int dy = -1; dy <= 1; dy++) {
								bool skip = false;
								if (dx == 0 && dy == 0) {
									skip = true;
								}

								flood_pixel_t newPixel;
								newPixel.x = currentPixel.x + dx;
								newPixel.y = currentPixel.y + dy;

								if (!inside(newPixel.x, newPixel.y)) {
									regionsThatTouchBounds.insert(regionNum);
									skip = true;
								}

								if (!skip) {
									int testResult = floodFillTest2(newPixel.x, newPixel.y, paths, pixels);
									if (testResult == 0) {
										pixelQueue.push(newPixel);
									} else if (testResult == 2) {
										pixels[(newPixel.y * width + newPixel.x)] = regionNum;
									}
								}
							}
						}
					}
				}

				if (count > 0) {
					regionNum++;
				}
			}
		}
	}
	
	size_t pixelsize = getPixelSize();

	std::map<int, Pixel *> hashToPixel;
	std::map<int, std::map<int, int>*> regionToPixelCounts;

	for (int x = 0; x < width; x++) {
		for (int y = 0; y < height; y++) {
			Pixel * currentColor = (Pixel *)(data + ((y * width + x) * pixelsize));
			
			int hash = getPixelHash(*currentColor);
			uint8 region = pixels[y * width + x];

			if (hashToPixel.find(hash) == hashToPixel.end()) {
				Pixel * pixelCopy = new Pixel;
				memcpy(pixelCopy, currentColor, pixelsize);

				hashToPixel[hash] = pixelCopy;
			}

			if (regionToPixelCounts.find(region) == regionToPixelCounts.end()) {
				regionToPixelCounts[region] = new std::map<int, int>();
			}

			std::map<int, int> *pixelCountsMap = regionToPixelCounts[region];
			if (pixelCountsMap->find(hash) == pixelCountsMap->end()) {
				(*pixelCountsMap)[hash] = 1;
			} else {
				int count = (*pixelCountsMap)[hash];
				count++;
				(*pixelCountsMap)[hash] = count;
			}
		}
	}
	
	Pixel clearP;
	clearPixel(clearP);

	std::map<int, Pixel *> regionToPixel;
	for (std::map<int, std::map<int, int> *>::iterator it = regionToPixelCounts.begin(); it != regionToPixelCounts.end(); ++it) {
		int region = it->first;
		std::map<int, int> *pixelCounts = it->second;
		
		if (regionsThatTouchBounds.find(region) != regionsThatTouchBounds.end()) {
			regionToPixel[region] = &clearP;
		} else {
			int maxCount = 0;
			for (std::map<int, int>::iterator it2 = pixelCounts->begin(); it2 != pixelCounts->end(); ++it2) {
				if (it2->second > maxCount) {
					maxCount = it2->second;
					regionToPixel[region] = hashToPixel[it2->first];
				}
			}
		}
	}
	
	if (debug == 1) {
		int i = 0;
		for (auto const& region : regionToPixel) {
			Pixel * pixel = new Pixel;
			pixel->rgba8[0] = 0;
			pixel->rgba8[1] = 0;
			pixel->rgba8[2] = 0;
			pixel->rgba8[i % 3] = 255;
			pixel->rgba8[3] = 255;
			regionToPixel[region.first] = pixel;
			i++;
		}
	}
	
	for (int x = 0; x < width; x++) {
		for (int y = 0; y < height; y++) {
			if (debug == 2) {
				Pixel pathP;
				paths->getPixel(x, y, pathP);

				unsigned char *pixeldata = data + ((y * width + x) * pixelsize);
				memcpy(pixeldata, &pathP, pixelsize);
			} else {
				uint8 region = pixels[y * width + x];
				Pixel *pixel = regionToPixel[region];
				
				unsigned char *pixeldata = data + ((y * width + x) * pixelsize);
				memcpy(pixeldata, pixel, pixelsize);
			}
		}
	}

	for (std::map<int, Pixel *>::iterator it = hashToPixel.begin(); it != hashToPixel.end(); ++it) {
		delete it->second;
	}

	for (std::map<int, std::map<int, int> *>::iterator it = regionToPixelCounts.begin(); it != regionToPixelCounts.end(); ++it) {
		delete it->second;
	}
}

void ImageData::paste(ImageData *src, int dx, int dy, int sx, int sy, int sw, int sh)
{
	PixelFormat dstformat = getFormat();
	PixelFormat srcformat = src->getFormat();

	int srcW = src->getWidth();
	int srcH = src->getHeight();
	int dstW = getWidth();
	int dstH = getHeight();

	size_t srcpixelsize = src->getPixelSize();
	size_t dstpixelsize = getPixelSize();

	// Check bounds; if the data ends up completely out of bounds, get out early.
	if (sx >= srcW || sx + sw < 0 || sy >= srcH || sy + sh < 0
			|| dx >= dstW || dx + sw < 0 || dy >= dstH || dy + sh < 0)
		return;

	// Normalize values to the inside of both images.
	if (dx < 0)
	{
		sw += dx;
		sx -= dx;
		dx = 0;
	}
	if (dy < 0)
	{
		sh += dy;
		sy -= dy;
		dy = 0;
	}
	if (sx < 0)
	{
		sw += sx;
		dx -= sx;
		sx = 0;
	}
	if (sy < 0)
	{
		sh += sy;
		dy -= sy;
		sy = 0;
	}

	if (dx + sw > dstW)
		sw = dstW - dx;

	if (dy + sh > dstH)
		sh = dstH - dy;

	if (sx + sw > srcW)
		sw = srcW - sx;

	if (sy + sh > srcH)
		sh = srcH - sy;

	Lock lock2(src->mutex);
	Lock lock1(mutex);

	uint8 *s = (uint8 *) src->getData();
	uint8 *d = (uint8 *) getData();

	// If the dimensions match up, copy the entire memory stream in one go
	if (srcformat == dstformat && (sw == dstW && dstW == srcW && sh == dstH && dstH == srcH))
	{
		memcpy(d, s, srcpixelsize * sw * sh);
	}
	else if (sw > 0)
	{
		// Otherwise, copy each row individually.
		for (int i = 0; i < sh; i++)
		{
			Row rowsrc = {s + (sx + (i + sy) * srcW) * srcpixelsize};
			Row rowdst = {d + (dx + (i + dy) * dstW) * dstpixelsize};

			if (srcformat == dstformat)
				memcpy(rowdst.u8, rowsrc.u8, srcpixelsize * sw);

			else if (srcformat == PIXELFORMAT_RGBA8 && dstformat == PIXELFORMAT_RGBA16)
				pasteRGBA8toRGBA16(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA8 && dstformat == PIXELFORMAT_RGBA16F)
				pasteRGBA8toRGBA16F(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA8 && dstformat == PIXELFORMAT_RGBA32F)
				pasteRGBA8toRGBA32F(rowsrc, rowdst, sw);

			else if (srcformat == PIXELFORMAT_RGBA16 && dstformat == PIXELFORMAT_RGBA8)
				pasteRGBA16toRGBA8(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA16 && dstformat == PIXELFORMAT_RGBA16F)
				pasteRGBA16toRGBA16F(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA16 && dstformat == PIXELFORMAT_RGBA32F)
				pasteRGBA16toRGBA32F(rowsrc, rowdst, sw);

			else if (srcformat == PIXELFORMAT_RGBA16F && dstformat == PIXELFORMAT_RGBA8)
				pasteRGBA16FtoRGBA8(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA16F && dstformat == PIXELFORMAT_RGBA16)
				pasteRGBA16FtoRGBA16(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA16F && dstformat == PIXELFORMAT_RGBA32F)
				pasteRGBA16FtoRGBA32F(rowsrc, rowdst, sw);

			else if (srcformat == PIXELFORMAT_RGBA32F && dstformat == PIXELFORMAT_RGBA8)
				pasteRGBA32FtoRGBA8(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA32F && dstformat == PIXELFORMAT_RGBA16)
				pasteRGBA32FtoRGBA16(rowsrc, rowdst, sw);
			else if (srcformat == PIXELFORMAT_RGBA32F && dstformat == PIXELFORMAT_RGBA16F)
				pasteRGBA32FtoRGBA16F(rowsrc, rowdst, sw);

			else
				throw love::Exception("Unsupported pixel format combination in ImageData:paste!");
		}
	}
}

void ImageData::pasteRGBA8toRGBA16(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.u16[i] = (uint16) src.u8[i] << 8u;
}

void ImageData::pasteRGBA8toRGBA16F(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.f16[i] = floatToHalf(src.u8[i] / 255.0f);
}

void ImageData::pasteRGBA8toRGBA32F(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.f32[i] = src.u8[i] / 255.0f;
}

void ImageData::pasteRGBA16toRGBA8(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.u8[i] = src.u16[i] >> 8u;
}

void ImageData::pasteRGBA16toRGBA16F(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.f16[i] = floatToHalf(src.u16[i] / 65535.0f);
}

void ImageData::pasteRGBA16toRGBA32F(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.f32[i] = src.u16[i] / 65535.0f;
}

void ImageData::pasteRGBA16FtoRGBA8(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.u8[i] = (uint8) (halfToFloat(src.f16[i]) * 255.0f);
}

void ImageData::pasteRGBA16FtoRGBA16(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.u16[i] = (uint16) (halfToFloat(src.f16[i]) * 65535.0f);
}

void ImageData::pasteRGBA16FtoRGBA32F(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.f32[i] = halfToFloat(src.f16[i]);
}

void ImageData::pasteRGBA32FtoRGBA8(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.u8[i] = (uint8) (src.f32[i] * 255.0f);
}

void ImageData::pasteRGBA32FtoRGBA16(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.u16[i] = (uint16) (src.f32[i] * 65535.0f);
}

void ImageData::pasteRGBA32FtoRGBA16F(Row src, Row dst, int w)
{
	for (int i = 0; i < w * 4; i++)
		dst.f16[i] = (uint16) floatToHalf(src.f32[i]);
}

love::thread::Mutex *ImageData::getMutex() const
{
	return mutex;
}

size_t ImageData::getPixelSize() const
{
	return getPixelFormatSize(format);
}

bool ImageData::validPixelFormat(PixelFormat format)
{
	switch (format)
	{
	case PIXELFORMAT_RGBA8:
	case PIXELFORMAT_RGBA16:
	case PIXELFORMAT_RGBA16F:
	case PIXELFORMAT_RGBA32F:
		return true;
	default:
		return false;
	}
}

bool ImageData::getConstant(const char *in, FormatHandler::EncodedFormat &out)
{
	return encodedFormats.find(in, out);
}

bool ImageData::getConstant(FormatHandler::EncodedFormat in, const char *&out)
{
	return encodedFormats.find(in, out);
}

std::vector<std::string> ImageData::getConstants(FormatHandler::EncodedFormat)
{
	return encodedFormats.getNames();
}

StringMap<FormatHandler::EncodedFormat, FormatHandler::ENCODED_MAX_ENUM>::Entry ImageData::encodedFormatEntries[] =
{
	{"tga", FormatHandler::ENCODED_TGA},
	{"png", FormatHandler::ENCODED_PNG},
};

StringMap<FormatHandler::EncodedFormat, FormatHandler::ENCODED_MAX_ENUM> ImageData::encodedFormats(ImageData::encodedFormatEntries, sizeof(ImageData::encodedFormatEntries));

} // image
} // love
