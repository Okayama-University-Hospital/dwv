import {
  getDwvVersion,
  getTypedArray,
  DicomParser
} from './dicom/dicomParser.js';
import {
  getUID,
  getElementsFromJSONTags,
  DicomWriter
} from './dicom/dicomWriter';
import {dictionary} from './dicom/dictionary';
import {getPixelDataTag} from './dicom/dicomTag';
import {App} from './app/application';
import {loadFromUri} from './utils/uri';
import {precisionRound} from './utils/string';
import {Point} from './math/point';
import {decoderScripts} from './image/decoder';
import {lut} from './image/luts';
import {buildMultipart} from './utils/array';
import {logger} from './utils/logger';
import {customUI} from './gui/generic';

const dicom = {
  getUID,
  getElementsFromJSONTags,
  getTypedArray,
  getPixelDataTag,
  dictionary,
  DicomParser,
  DicomWriter
};
const gui = {
  customUI
};
const image = {
  decoderScripts,
  lut
};
const math = {
  Point
};
const utils = {
  loadFromUri,
  precisionRound,
  buildMultipart
};

export {
  getDwvVersion,
  logger,
  App,
  dicom,
  gui,
  image,
  math,
  utils
};
