#pragma once

#include "precomp.h"


namespace Platform {

// Get the full path to an asset (files under 'core/assets/' in the repository) given its filename
std::string getAssetPath(const char *filename);

}
