#include "drawing2.h"

#include "behaviors/all.h"


//
// Draw
//

void Drawing2Behavior::handleDrawComponent(
    ActorId actorId, const Drawing2Component &component) const {
  lv.graphics.push();


  lv.graphics.pop();
}
