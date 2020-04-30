local cjson = require "cjson"
local inspect = require "../vendor/inspect"

local DEBUG_JS_EVENTS = false

local jsEvents = {}

local lists = {} -- `eventName` -> `listenerId` -> `listener`
local nextId = 1

function jsEvents.listen(name, listener)
    local list = lists[name]
    if not list then
        list = {}
        lists[name] = list
    end

    local id = nextId
    nextId = nextId + 1
    list[id] = listener

    return function()
        list[id] = nil
    end
end

-- does not get cleared after BASE_RELOAD
local permanentLists = {} -- `eventName` -> `listenerId` -> `listener`
local permanentLextId = 1
function jsEvents.permanentListen(name, listener)
    local list = permanentLists[name]
    if not list then
        list = {}
        permanentLists[name] = list
    end

    local id = permanentLextId
    permanentLextId = permanentLextId + 1
    list[id] = listener

    return function()
        list[id] = nil
    end
end

function jsEvents.clearListeners()
    lists = {}
    nextId = 1
end

local receiveChannel = love.thread.getChannel("JS_EVENTS")

function jsEvents.DEBUG_SEND_LUA_EVENT(name, params)
    receiveChannel:push(
        cjson.encode(
            {
                name = name,
                params = params
            }
        )
    )
end

function jsEvents.update()
    local eventJson
    while true do
        local eventJson = receiveChannel:pop()
        if eventJson == nil then
            return
        end
        local event = cjson.decode(eventJson)
        if event then
            if DEBUG_JS_EVENTS then
                if event.name == "BASE_RELOAD" then
                    print("JSEVENT js -> lua BASE_RELOAD " .. string.sub(event.params.initialParams, 1, 200))
                else
                    print("JSEVENT js -> lua " .. inspect(event, {newline = ""}))
                end
            end

            local list = lists[event.name]
            if list then
                local params = event.params
                for _, listener in pairs(list) do
                    listener(params)
                end
            end

            list = permanentLists[event.name]
            if list then
                local params = event.params
                for _, listener in pairs(list) do
                    listener(params)
                end
            end
        end
    end
end

local platform = love.system.getOS()
if platform == "iOS" or platform == "Android" then -- Use channels on mobile
    local sendChannel = love.thread.getChannel("LUA_TO_JS_EVENTS")
    function jsEvents.send(name, params)
        if DEBUG_JS_EVENTS then
            if name ~= "GHOST_PRINT" then
                if name == "CASTLE_TOOLS_UPDATE" then
                    print("JSEVENT lua -> js " .. name)
                else
                    print("JSEVENT lua -> js " .. name .. "   " .. inspect(params, {newline = ""}))
                end
            end
        end

        sendChannel:push(
            cjson.encode(
                {
                    name = name,
                    params = params
                }
            )
        )
    end
elseif not CASTLE_SERVER then -- Use FFI on desktop
    local ffi = require "ffi"
    ffi.cdef [[
        void ghostSendJSEvent(const char *eventName, const char *serializedParams);
    ]]
    local C = ffi.C

    function jsEvents.send(name, params)
        C.ghostSendJSEvent(name, cjson.encode(params))
    end
else -- Noop on remote server
    function jsEvents.send()
    end
end

return jsEvents
