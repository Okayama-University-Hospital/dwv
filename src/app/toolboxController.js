import { InteractionEventNames, getEventOffset } from '../gui/generic';

/**
 * Toolbox controller.
 */
export class ToolboxController {

  /**
   * List of tools to control.
   *
   * @type {object}
   */
  #toolList;

  /**
   * Selected tool.
   *
   * @type {object}
   */
  #selectedTool = null;

  /**
   * Callback store to allow attach/detach.
   *
   * @type {Array}
   */
  #callbackStore = [];

  /**
   * Current layers bound to tool.
   *
   * @type {object}
   */
  #boundLayers = {};

  /**
   * @param {object} toolList The list of tool objects.
   */
  constructor(toolList) {
    this.#toolList = toolList;
  }

  /**
   * Initialise.
   */
  init() {
    for (const key in this.#toolList) {
      this.#toolList[key].init();
    }
    // keydown listener
    window.addEventListener('keydown',
      this.#getOnMouch('window', 'keydown'), true);
  }

  /**
   * Get the tool list.
   *
   * @returns {Array} The list of tool objects.
   */
  getToolList() {
    return this.#toolList;
  }

  /**
   * Check if a tool is in the tool list.
   *
   * @param {string} name The name to check.
   * @returns {boolean} The tool list element for the given name.
   */
  hasTool(name) {
    return typeof this.getToolList()[name] !== 'undefined';
  }

  /**
   * Get the selected tool.
   *
   * @returns {object} The selected tool.
   */
  getSelectedTool() {
    return this.#selectedTool;
  }

  /**
   * Get the selected tool event handler.
   *
   * @param {string} eventType The event type, for example
   *   mousedown, touchstart...
   * @returns {Function} The event handler.
   */
  getSelectedToolEventHandler(eventType) {
    return this.getSelectedTool()[eventType];
  }

  /**
   * Set the selected tool.
   *
   * @param {string} name The name of the tool.
   */
  setSelectedTool(name) {
    // check if we have it
    if (!this.hasTool(name)) {
      throw new Error('Unknown tool: \'' + name + '\'');
    }
    // de-activate previous
    if (this.#selectedTool) {
      this.#selectedTool.activate(false);
    }
    // set internal var
    this.#selectedTool = this.#toolList[name];
    // activate new tool
    this.#selectedTool.activate(true);
  }

  /**
   * Set the selected tool live features.
   *
   * @param {object} list The list of features.
   */
  setToolFeatures(list) {
    if (this.getSelectedTool()) {
      this.getSelectedTool().setFeatures(list);
    }
  }

  /**
   * Listen to layer interaction events.
   *
   * @param {object} layer The layer to listen to.
   * @param {string} layerGroupDivId The associated layer group div id.
   */
  bindLayer(layer, layerGroupDivId) {
    if (typeof this.#boundLayers[layerGroupDivId] !== 'undefined') {
      this.#unbindLayer(this.#boundLayers[layerGroupDivId]);
    }
    layer.bindInteraction();
    // interaction events
    const names = InteractionEventNames;
    for (let i = 0; i < names.length; ++i) {
      layer.addEventListener(names[i],
        this.#getOnMouch(layer.getId(), names[i]));
    }
    document.getElementById(layer.getId()).addEventListener('contextmenu', (event) => {event.preventDefault()});
    // update class var
    this.#boundLayers[layerGroupDivId] = layer;
  }

  /**
   * Remove canvas mouse and touch listeners.
   *
   * @param {object} layer The layer to stop listening to.
   */
  #unbindLayer(layer) {
    layer.unbindInteraction();
    // interaction events
    const names = InteractionEventNames;
    for (let i = 0; i < names.length; ++i) {
      layer.removeEventListener(names[i],
        this.#getOnMouch(layer.getId(), names[i]));
    }
    document.getElementById(layer.getId()).removeEventListener('contextmenu', (event) => {event.preventDefault()});
  }

  /**
   * Mou(se) and (T)ouch event handler. This function just determines
   * the mouse/touch position relative to the canvas element.
   * It then passes it to the current tool.
   *
   * @param {string} layerId The layer id.
   * @param {string} eventType The event type.
   * @returns {object} A callback for the provided layer and event.
   */
  #getOnMouch(layerId, eventType) {
    // augment event with converted offsets
    const augmentEventOffsets = function (event) {
      // event offset(s)
      const offsets = getEventOffset(event);
      // should have at least one offset
      event._x = offsets[0].x;
      event._y = offsets[0].y;
      // possible second
      if (offsets.length === 2) {
        event._x1 = offsets[1].x;
        event._y1 = offsets[1].y;
      }
    };

    const applySelectedTool = (event, selectedTool = undefined) => {
      // make sure we have a tool
      if (this.#selectedTool) {
        const func = selectedTool === undefined ? this.#selectedTool[event.type] : this.#toolList[selectedTool][event.type];
        if (func) {
          func(event);
        }
      }
    };

    if (typeof this.#callbackStore[layerId] === 'undefined') {
      this.#callbackStore[layerId] = [];
    }

    if (typeof this.#callbackStore[layerId][eventType] === 'undefined') {
      let callback = null;
      if (eventType === 'keydown') {
        callback = function (event) {
          applySelectedTool(event);
        };
      } else if (eventType === 'touchend') {
        callback = function (event) {
          applySelectedTool(event);
        };
      } else {
        // mouse or touch events
        callback = function (event) {
          augmentEventOffsets(event);
          if ((event.type === 'mousedown' && event.button === 2) ||
              (event.type === 'mousemove' && event.buttons === 2)) {
            // 右クリックの場合はWindowLevelを適用
            applySelectedTool(event, 'WindowLevel');
          } else {
            applySelectedTool(event);
          }
        };
      }
      // store callback
      this.#callbackStore[layerId][eventType] = callback;
    }

    return this.#callbackStore[layerId][eventType];
  }

} // class ToolboxController
