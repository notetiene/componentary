# Components

Library to construct custom components (i.e. Element tree). It tries to emulate the behavior of Web Components while being native HTML.

## Installation

Simply load the `components.js` file. The `components` global object contains the library.

## Usage

This library provides two useful methods: `registerElement` and `createElement`.

### Registering a component

To register a component, `components.registerElement` must be called with:

* (string) A name to identify the component
* (string) A template containing the component' members (elements)
* (object) A prototype defining its behavior. The prototype can contain the following methods:
  - (function) A callback (`createdCallback`) to call when an instance of the component is created.
  - (function) A callback (`attachedCallback`) to call when the component is actually attached to the `document`.
  - (function) A callback (`attributeChangedCallback`) to call when attributes of the component instance are changed.

When a component is registered, it cannot be deleted or changed. 

## License
This directory and the whole project is subject to the [GPLv3 License](license).
