import * as React from 'react';
import * as NativeUtil from '~/native/nativeutil';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  Dropdown,
  NumberInput,
  Slider,
  RadioButton,
  Tab,
  Tabs,
  TextArea,
  TextInput,
  Toggle,
} from 'carbon-components-react';

import Logs from '~/common/logs';
import ToolMarkdown from '~/components/game/ToolMarkdown';

import '~/components/game/Tools.min.css';

//
// Infrastructure
//

let nextEventId = 1;
const sendEvent = (pathId, event) => {
  const eventId = nextEventId++;
  NativeUtil.sendLuaEvent('CASTLE_TOOL_EVENT', { pathId, event: { ...event, eventId } });
  return eventId;
};

const elementTypes = {};

class Tool extends React.PureComponent {
  render() {
    const { element } = this.props;
    const ElemType = elementTypes[element.type];
    if (!ElemType) {
      Logs.error(`'${element.type}' is not a valid UI element type`);
      return null;
    }
    return <ElemType element={element} />;
  }
}

const orderedChildren = (element) => {
  if (!element.children) {
    return [];
  }
  if (element.children.count === 0) {
    return [];
  }
  const result = [];
  let id = element.children.lastId;
  while (id !== undefined && id !== null) {
    const child = element.children[id];
    if (!child) {
      break; // This shouldn't really happen...
    }
    result.push({ id, child });
    id = element.children[id].prevId;
  }
  return result.reverse();
};

const renderChildren = (element) =>
  orderedChildren(element).map(({ id, child }) => <Tool key={id} element={child} />);

const STYLES_PANE_CONTAINER = css`
  display: flex;
  flex-direction: column;
`;

class ToolPane extends React.PureComponent {
  render() {
    const { element } = this.props;
    return <div className={STYLES_PANE_CONTAINER}>{renderChildren(element)}</div>;
  }
}
elementTypes['pane'] = ToolPane;

class Carbon extends React.PureComponent {
  render() {
    return <div className="carbon">{this.props.children}</div>;
  }
}

//
// Components
//

class ToolButton extends React.PureComponent {
  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Button
          {...element.props}
          small={!(element.props && element.props.big)}
          kind={(element.props && element.props.kind) || 'secondary'}
          onClick={() => sendEvent(element.pathId, { type: 'onClick' })}>
          {element.props.label}
        </Button>
      </Carbon>
    );
  }
}
elementTypes['button'] = ToolButton;

class ToolCheckbox extends React.PureComponent {
  state = {
    checked: this.props.element.props.checked,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        checked: props.element.props.checked,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Checkbox
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          checked={this.state.checked}
          onChange={(checked) => {
            this.setState({
              checked,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                checked,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['checkbox'] = ToolCheckbox;

class ToolDropdown extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Dropdown
          {...element.props}
          id={element.pathId}
          selectedItem={this.state.value}
          titleText={element.props && !element.props.hideLabel ? element.props.label : null}
          label={
            element.props && element.props.placeholder
              ? element.props.placeholder
              : 'Select an option...'
          }
          onChange={({ selectedItem }) => {
            this.setState({
              value: selectedItem,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: selectedItem,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['dropdown'] = ToolDropdown;

elementTypes['markdown'] = ToolMarkdown;

class ToolNumberInput extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <NumberInput
          {...element.props}
          id={element.pathId}
          value={this.state.value}
          onChange={(event) => {
            this.setState({
              value: event.imaginaryTarget.valueAsNumber,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: event.imaginaryTarget.valueAsNumber,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['numberInput'] = ToolNumberInput;

class ToolRadioButtonGroup extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;

    let maybeLabel = null;
    if (element.props && element.props.label && !element.props.hideLabel) {
      maybeLabel = (
        <label
          htmlFor={element.pathId}
          className={`bx--label${element.props.disabled ? `  bx--label--disabled` : ''}`}>
          {element.props.label}
        </label>
      );
    }

    let maybeHelperText = null;
    if (element.props && element.props.helperText) {
      maybeHelperText = (
        <helperText
          htmlFor={element.pathId}
          className={`bx--form__helper-text${
            element.props.disabled ? `  bx--form__helper-text--disabled` : ''
          }`}>
          {element.props.helperText}
        </helperText>
      );
    }

    return (
      <Carbon>
        <div className="bx--form-item">
          {maybeLabel}
          {maybeHelperText}
          <div
            className={
              element.props && element.props.horizontal
                ? 'bx--radio-button-group'
                : 'bx--radio-button-group--vertical'
            }>
            {((element.props && element.props.items) || []).map((item) => (
              <RadioButton
                key={item}
                item={item}
                labelText={item}
                checked={this.state.value == item}
                disabled={element.props && element.props.disabled}
                onChange={(value, name, event) => {
                  if (event.target.checked) {
                    this.setState({
                      value: item,
                      lastSentEventId: sendEvent(element.pathId, {
                        type: 'onChange',
                        value: item,
                      }),
                    });
                  }
                }}
              />
            ))}
          </div>
        </div>
      </Carbon>
    );
  }
}
elementTypes['radioButtonGroup'] = ToolRadioButtonGroup;

// Copied from Carbon CSS, so that we can apply only to Accordion itself but not its children
const STYLES_SECTION_CONTAINER = css`
  .bx--accordion {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font-family: inherit;
    vertical-align: baseline;
    list-style: none;
    width: 100%;
  }
  .bx--accordion > *,
  .bx--accordion > *:before,
  .bx--accordion > *:after {
    box-sizing: inherit;
  }
  .bx--accordion__item {
    transition: all 110ms cubic-bezier(0.2, 0, 0.38, 0.9);
    border-top: 1px solid #3d3d3d;
    overflow: visible;
  }
  .bx--accordion__item:last-child {
    border-bottom: 1px solid #3d3d3d;
  }
  .bx--accordion__heading {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font-family: inherit;
    vertical-align: baseline;
    display: inline-block;
    background: none;
    appearance: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    width: 100%;
    color: #f3f3f3;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
    padding: 0.375rem 0;
    flex-direction: row-reverse;
    position: relative;
    width: 100%;
    margin: 0;
    transition: background-color cubic-bezier(0.2, 0, 0.38, 0.9) 110ms;
  }
  .bx--accordion__heading > *,
  .bx--accordion__heading > *:before,
  .bx--accordion__heading > *:after {
    box-sizing: inherit;
  }
  .bx--accordion__heading::-moz-focus-inner {
    border: 0;
  }
  .bx--accordion__heading:hover:before,
  .bx--accordion__heading:focus:before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: calc(100% + 2px);
  }
  .bx--accordion__heading:hover:before {
    background-color: #353535;
  }
  .bx--accordion__heading:focus {
    outline: none;
  }
  .bx--accordion__heading:focus:before {
    border: 2px solid #ff00ff;
    box-sizing: border-box;
  }
  .bx--accordion__arrow {
    outline: 2px solid transparent;
    outline-offset: -2px;
    flex: 0 0 1rem;
    width: 1rem;
    height: 1rem;
    margin: 0 1rem 0 0;
    fill: #f3f3f3;
    transform: rotate(90deg);
    transition: all 110ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  .bx--accordion__title {
    font-family: 'sf-mono', Consolas, monaco, monospace;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.25rem;
    letter-spacing: 0.16px;
    margin: 0 0 0 1rem;
    width: 100%;
    text-align: left;
    z-index: 0;
  }
  .bx--accordion__content {
    transition: height cubic-bezier(0.2, 0, 0.38, 0.9) 110ms,
      padding cubic-bezier(0.2, 0, 0.38, 0.9) 110ms;
    padding-left: 1rem;
    padding-right: 25%;
    height: 0;
    visibility: hidden;
    opacity: 0;
  }
  @media (max-width: 42rem) {
    .bx--accordion__content {
      padding-right: 3rem;
    }
  }
  .bx--accordion__content p {
    font-family: 'sf-mono', Consolas, monaco, monospace;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.25rem;
    letter-spacing: 0.16px;
  }
  .bx--accordion__item--active {
    overflow: visible;
  }
  .bx--accordion__item--active .bx--accordion__content {
    padding-bottom: 1.5rem;
    padding-top: 0.5rem;
    height: auto;
    visibility: visible;
    opacity: 1;
    transition: height cubic-bezier(0, 0, 0.38, 0.9) 110ms,
      padding-top cubic-bezier(0, 0, 0.38, 0.9) 110ms,
      padding-bottom cubic-bezier(0, 0, 0.38, 0.9) 110ms;
  }
  .bx--accordion__item--active .bx--accordion__arrow {
    /*rtl:ignore*/
    transform: rotate(-90deg);
    fill: #f3f3f3;
  }
  .bx--accordion.bx--skeleton .bx--accordion__heading,
  .bx--accordion.bx--skeleton .bx--accordion__button {
    cursor: default;
  }
  .bx--accordion.bx--skeleton .bx--accordion__arrow {
    pointer-events: none;
    fill: #f3f3f3;
    cursor: default;
  }
  .bx--accordion.bx--skeleton .bx--accordion__arrow:hover,
  .bx--accordion.bx--skeleton .bx--accordion__arrow:focus,
  .bx--accordion.bx--skeleton .bx--accordion__arrow:active {
    border: none;
    outline: none;
    cursor: default;
  }
  .bx--skeleton .bx--accordion__heading:focus .bx--accordion__arrow {
    border: none;
    outline: none;
    cursor: default;
  }
  .bx--accordion__title.bx--skeleton__text {
    margin-bottom: 0;
  }
`;

class ToolSection extends React.PureComponent {
  render() {
    const { element } = this.props;

    return (
      <div className={STYLES_SECTION_CONTAINER}>
        <Accordion>
          <AccordionItem
            {...element.props}
            ref={(r) => (this._accordionItemRef = r)}
            title={element.props && element.props.label}
            open={element.open}
            onHeadingClick={({ isOpen }) => {
              sendEvent(element.pathId, { type: 'onChange', open: isOpen });
              // Make it listen to our `element.open` state...
              this._accordionItemRef &&
                this._accordionItemRef.setState({ open: element.open, prevOpen: element.open });
            }}>
            {renderChildren(element)}
          </AccordionItem>
        </Accordion>
      </div>
    );
  }
}
elementTypes['section'] = ToolSection;

class ToolSlider extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Slider
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          value={this.state.value}
          onChange={({ value }) => {
            value = typeof value === 'number' ? value : Number.parseFloat(value);
            this.setState({
              value,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['slider'] = ToolSlider;

class ToolTabs extends React.PureComponent {
  componentDidMount() {
    const { element } = this.props;
    const children = orderedChildren(element).filter(({ id, child }) => child.type == 'tab');
    if (children[0]) {
      sendEvent(children[0].child.pathId, { type: 'onActive', value: true });
    }
  }

  render() {
    const { element } = this.props;

    const children = orderedChildren(element).filter(({ id, child }) => child.type == 'tab');

    return (
      <Carbon>
        <div className="tabs-container">
          <Tabs
            {...element.props}
            onSelectionChange={(activeIndex) =>
              children.forEach(({ id, child }, childIndex) =>
                sendEvent(child.pathId, { type: 'onActive', value: childIndex === activeIndex })
              )
            }>
            {children.map(({ id, child }) => (
              <Tab key={id} {...child.props} href="javascript:void(0);">
                {renderChildren(child)}
              </Tab>
            ))}
          </Tabs>
        </div>
      </Carbon>
    );
  }
}
elementTypes['tabs'] = ToolTabs;

class ToolTextArea extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <TextArea
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          value={this.state.value}
          onChange={(event) => {
            this.setState({
              value: event.target.value,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: event.target.value,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['textArea'] = ToolTextArea;

class ToolTextInput extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <TextInput
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          value={this.state.value}
          onChange={(event) => {
            this.setState({
              value: event.target.value,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: event.target.value,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['textInput'] = ToolTextInput;

class ToolToggle extends React.PureComponent {
  state = {
    toggled: this.props.element.props.toggled,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        toggled: props.element.props.toggled,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Toggle
          {...element.props}
          id={element.pathId}
          toggled={this.state.toggled}
          onToggle={(toggled) => {
            this.setState({
              toggled,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onToggle',
                toggled,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['toggle'] = ToolToggle;

//
// Container
//

const applyDiff = (t, diff) => {
  if (diff == null) {
    return t;
  }

  // If it's an exact diff just return it
  if (diff.__exact) {
    delete diff.__exact;
    return diff;
  }

  // Copy untouched keys, then apply diffs to touched keys
  t = typeof t === 'object' ? t : {};
  const u = {};
  for (let k in t) {
    if (!(k in diff)) {
      u[k] = t[k];
    }
  }
  for (let k in diff) {
    const v = diff[k];
    if (typeof v === 'object') {
      u[k] = applyDiff(t[k], v);
    } else if (v !== '__NIL') {
      u[k] = v;
    }
  }
  return u;
};

const STYLES_CONTAINER = css`
  width: 300px;
  height: 100%;

  font-family: ${Constants.font.mono} !important;

  /* Based on the 'g90' theme (https://www.carbondesignsystem.com/guidelines/themes/) which 'Tools.scss' uses */
  color: #f3f3f3;
  background-color: #171717;

  /* Inputs seem to not properly hide the spinner buttons */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Make input elements stretch to width of container */
  .bx--form-item {
    align-items: stretch !important;
  }

  /* Sliders are too wide by default */
  .bx--slider {
    min-width: 0 !important;
    flex: 1;
  }

  /* Fix number input fonts */
  input[type='number'] {
    font-family: ${Constants.font.mono} !important;
  }

  /* Justify radio button labels to left */
  .bx--radio-button-group--vertical .bx--radio-button__label {
    justify-content: flex-start !important;
  }

  /* Make accordion children stretch */
  .bx--accordion__item--active .bx--accordion__content {
    padding-left: 1rem !important;
    padding-right: 0.8rem !important;
    padding-bottom: 0.8rem !important;
  }

  /* Make tab headers fit */
  .bx--tabs__nav {
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
  }
  .bx--tabs__nav-item {
    display: flex !important;
    flex: 1 !important;
    width: auto !important;
  }
  a.bx--tabs__nav-link,
  a.bx--tabs__nav-link:focus,
  a.bx--tabs__nav-link:active {
    display: flex !important;
    flex: 1 !important;
    width: auto !important;
  }

  /* Add border around tabs container */
  .tabs-container {
    border-bottom: 1px solid #3d3d3d !important;
    padding-bottom: 0.6rem !important;
  }

  /* Add some general bottom margin */
  .bx--number,
  .bx--text-input__field-wrapper,
  .bx--text-area__wrapper,
  .bx--dropdown,
  .bx--radio-button-group--vertical,
  .bx--slider-container,
  .bx--accordion,
  .bx--toggle__label,
  .bx--btn,
  .tabs-container {
    margin-bottom: 14px !important;
  }

  padding: 14px;

  overflow-y: scroll;
  overflow-x: hidden;

  ::-webkit-scrollbar {
    width: 8px;
    height: 100%;
  }

  ::-webkit-scrollbar-track {
    background: black;
  }

  ::-webkit-scrollbar-thumb {
    background: white;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: magenta;
  }
`;

const DEBUG_PREPOPULATED = false;

export default class Tools extends React.PureComponent {
  static initialState = {
    root: DEBUG_PREPOPULATED ? {} : {},
    visible: DEBUG_PREPOPULATED,
  };

  state = Tools.initialState;

  componentDidMount() {
    window.addEventListener('CASTLE_TOOLS_UPDATE', this._handleUpdate);
    NativeUtil.sendLuaEvent('CASTLE_TOOLS_NEEDS_SYNC', {});
  }

  componentWillUnmount() {
    window.removeEventListener('CASTLE_TOOLS_UPDATE', this._handleUpdate);
  }

  _handleUpdate = (e) => {
    const diff = JSON.parse(e.params);
    // console.log(`diff: ${JSON.stringify(diff, null, 2)}`);

    const prevVisible = this.state.visible;
    this.setState(
      ({ root }) => {
        const newRoot = applyDiff(root, diff);
        const newVisible =
          newRoot.panes &&
          Object.values(newRoot.panes).find(
            (element) => element.children && element.children.count > 0
          );
        return { root: newRoot, visible: newVisible };
      },
      () => {
        if (prevVisible !== this.state.visible) {
          this.props.onLayoutChange && this.props.onLayoutChange();
        }
      }
    );
  };

  clearState() {
    this.setState(Tools.initialState);
  }

  render() {
    // console.log(`render: ${JSON.stringify(this.state.root, null, 2)}`);

    return this.state.visible ? (
      <div className={STYLES_CONTAINER}>
        {Object.values(this.state.root.panes).map((element, i) => (
          <ToolPane key={(element.props && element.props.name) || i} element={element} />
        ))}
      </div>
    ) : null;
  }
}
