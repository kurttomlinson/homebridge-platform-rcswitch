#include <node.h>
#include <unistd.h>
#include <uv.h>
#include <v8.h>

#include "rcswitch.h"

// Useful documentation when working on this file:
// https://nodejs.org/api/addons.html

using namespace v8;

void Send(const v8::FunctionCallbackInfo<v8::Value> &args) {
  Isolate *isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();
  int pin = Local<Integer>::Cast(args[0])->Int32Value(context).FromJust();
  unsigned int value =
      Local<Integer>::Cast(args[1])->Uint32Value(context).FromJust();
  unsigned int pulse =
      Local<Integer>::Cast(args[2])->Uint32Value(context).FromJust();

  rcswitch_send(1, pin, 10, pulse, value, 24);
  args.GetReturnValue().Set(Undefined(isolate));
}

void init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(exports, "send", Send);
}

NODE_MODULE(modulename, init);
