import {ListenerHandler} from '../utils/listen';
import {mergeObjects} from '../utils/operator';
import {DicomElementsWrapper} from '../dicom/dicomElementsWrapper';

/*
 * Data (list of {image, meta}) controller.
 *
 * @class
 */
export class DataController {

  /**
   * List of {image, meta}.
   *
   * @private
   * @type {object}
   */
  #data = {};

  /**
   * Listener handler.
   *
   * @type {ListenerHandler}
   * @private
   */
  #listenerHandler = new ListenerHandler();

  /**
   * Get the length of the data storage.
   *
   * @returns {number} The length.
   */
  length() {
    return Object.keys(this.#data).length;
  }

  /**
   * Reset the class: empty the data storage.
   */
  reset() {
    this.#data = [];
  }

  /**
   * Get a data at a given index.
   *
   * @param {number} index The index of the data.
   * @returns {object} The data.
   */
  get(index) {
    return this.#data[index];
  }

  /**
   * Set the image at a given index.
   *
   * @param {number} index The index of the data.
   * @param {Image} image The image to set.
   */
  setImage(index, image) {
    this.#data[index].image = image;
    // fire image set
    this.#fireEvent({
      type: 'imageset',
      value: [image],
      dataid: index
    });
    // listen to image change
    image.addEventListener('imagechange', this.#getFireEvent(index));
  }

  /**
   * Add a new data.
   *
   * @param {number} index The index of the data.
   * @param {Image} image The image.
   * @param {object} meta The image meta.
   */
  addNew(index, image, meta) {
    if (typeof this.#data[index] !== 'undefined') {
      throw new Error('Index already used in storage: ' + index);
    }
    // store the new image
    this.#data[index] = {
      image: image,
      meta: this.#getMetaObject(meta)
    };
    // listen to image change
    image.addEventListener('imagechange', this.#getFireEvent(index));
  }

  /**
   * Update the current data.
   *
   * @param {number} index The index of the data.
   * @param {Image} image The image.
   * @param {object} meta The image meta.
   */
  update(index, image, meta) {
    var dataToUpdate = this.#data[index];

    // add slice to current image
    dataToUpdate.image.appendSlice(image);

    // update meta data
    // TODO add time support
    var idKey = '';
    if (typeof meta.x00020010 !== 'undefined') {
      // dicom case
      idKey = 'InstanceNumber';
    } else {
      idKey = 'imageUid';
    }
    dataToUpdate.meta = mergeObjects(
      dataToUpdate.meta,
      this.#getMetaObject(meta),
      idKey,
      'value');
  }

  /**
   * Add an event listener to this class.
   *
   * @param {string} type The event type.
   * @param {object} callback The method associated with the provided
   *   event type, will be called with the fired event.
   */
  addEventListener(type, callback) {
    this.#listenerHandler.add(type, callback);
  }

  /**
   * Remove an event listener from this class.
   *
   * @param {string} type The event type.
   * @param {object} callback The method associated with the provided
   *   event type.
   */
  removeEventListener(type, callback) {
    this.#listenerHandler.remove(type, callback);
  }

  /**
   * Fire an event: call all associated listeners with the input event object.
   *
   * @param {object} event The event to fire.
   * @private
   */
  #fireEvent = (event) => {
    this.#listenerHandler.fireEvent(event);
  };

  /**
   * Get a fireEvent function that adds the input index
   * to the event value.
   *
   * @param {number} index The data index.
   * @returns {Function} A fireEvent function.
   */
  #getFireEvent(index) {
    return (event) => {
      event.dataid = index;
      this.#fireEvent(event);
    };
  }

  /**
   * Get a meta data object.
   *
   * @param {*} meta The meta data to convert.
   * @returns {*} object for DICOM, array for DOM image.
   */
  #getMetaObject(meta) {
    var metaObj = null;
    // wrap meta if dicom (x00020010: transfer syntax)
    if (typeof meta.x00020010 !== 'undefined') {
      var newDcmMetaData = new DicomElementsWrapper(meta);
      metaObj = newDcmMetaData.dumpToObject();
    } else {
      metaObj = meta;
    }
    return metaObj;
  }

} // ImageController class
