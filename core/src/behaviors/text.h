#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct TextComponent : BaseComponent {
  struct Props {
    PROP(std::string, content) = "";
    PROP(bool, visible) = true;
    PROP(int, order) = -1;
  } props;
};

class TextBehavior : public BaseBehavior<TextBehavior, TextComponent> {
public:
  static constexpr auto name = "Text";
  static constexpr auto behaviorId = 19;
  static constexpr auto displayName = "Text";

  using BaseBehavior::BaseBehavior;

  void handleReadComponent(ActorId actorId, TextComponent &component, Reader &reader);
  void handlePerform(double dt);

  std::queue<int> clickedTextActorIdsQueue;

private:
  friend struct ShowResponse;
  friend struct HideResponse;
  friend struct HideTextResponse;


  std::string formatContent(const std::string &content) const;

  std::string lastDataSent;
  void maybeSendBridgeData();
};
