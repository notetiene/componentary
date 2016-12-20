/*global MutationObserver, CSSRule */

/**
 * @fileOverview This file contains the _componentary_ module for
 * emulating Web Components behavior.
 * @name componentary.js<src>
 * @author Etienne Prud’homme
 * @version 1.0.0
 * @link https://github.com/notetiene/componentary
 * @todo Keep track of instances. This way, the style tag could be
 * removed.
 * @license MIT
 */

/**
 * Module to construct custom components (i.e. Element tree). It tries
 * to emulate the behavior of Web Components while being native HTML.
 * @returns {Object} Methods to register a component
 * ({@link registerElement}) and to create an instance of that
 * component ({@link createElement}).
 * @throws {Error} Errors about component initialization.
 */
var components = (function() {
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
    }

    function mergeObjects(that, object) {
        var prop;
        for(prop in object) {
            if(object.hasOwnProperty(prop) && that[prop] === undefined) {
                that[prop] = object[prop];
            }
        }
    }

    /**
     * Utility function to parse CSS from a {@link String}.
     * @param {String} styleContent - CSS rules as {@link String}.
     * @returns {CSSRuleList} A list of {@link CSSRule}.
     * @see http://stackoverflow.com/a/14865690
     */
    function rulesForCssText(styleContent) {
        var doc = document.implementation.createHTMLDocument('');
        var styleElement = document.createElement('style');

        styleElement.textContent = styleContent.replace(/\$self/g, '.componentary-lib-self-component');
        // the style will only be parsed once it is added to a document
        doc.body.appendChild(styleElement);
        return styleElement.sheet.cssRules;
    }

    /**
     * Transform a {@link CSSRuleList} to String while optionally adding
     * a prefix before selectors. Currently only support
     * {@link CSSRuleList} with {@link CSSStyleRule} or
     * {@link CSSMediaRule}.
     * @param {CSSRuleList} ruleList - The list to transform.
     * @param {String} [prefix] - A prefix to add before selectors.
     * @returns {String} The {@link CSSRulesList} transformed into
     * {@link String}.
     * @throws {Error} A rule in {@link ruleList} contains a type not
     * supported.
     */
    function CSSRuleListToString(ruleList, prefix) {
        var i = 0;
        var rule = null;
        var len;
        var result = '';
        var _prefix;
        if(prefix && prefix !== '') {
            _prefix = prefix + ' ';
        } else {
            _prefix = '';
        }

        for(len = ruleList.length; i < len; i++) {
            rule = ruleList[i];

            if(rule.type === CSSRule.MEDIA_RULE) {
                result += ' @media ' + rule.media.mediaText + ' { ';
                result += CSSRuleListToString(rule.cssRules, prefix);
                result += ' }';
                continue;
            }

            if(rule.type !== CSSRule.STYLE_RULE) {
                throw new Error('Only style rules and media rules are ' +
                                'currently supported for style scoping');
            }

            if(rule.selectorText.trim() === '.componentary-lib-self-component') {
                result += rule.cssText.replace(/\.componentary-lib-self-component/g, prefix);
                continue;
            }

            result += _prefix + rule.cssText;
        }

        return result;
    }

    /**
     * Utility to add a selector according to {@link topNode} id or
     * classes. Thus, it “makes” the {@link styleContent} scoped.
     * @param {String} styleContent - CSS rules to restrict the
     * scope to {@link topNode}.
     * @param {Node} topNode - A node that has classes that will act as
     * scope.
     */
    function CSSRulesScoped(styleContent, topNode) {
        var rules = rulesForCssText(styleContent);
        var selector = topNode.className;
        var scopedRules = '';

        if(selector.length < 10) {
            throw new Error('“topNode” doesn’t contain classes to act as' +
                            'selector or is too short & risk to have ' +
                            'collisions');
        }

        // Replace spaces with the class selector
        selector = '.' + selector.replace(/ /g, '.');

        scopedRules = CSSRuleListToString(rules, selector);

        return scopedRules;
    }


    /**
     * Inject the {@link customElement} styles if they’re not present
     * already.
     * @param {String} name - The name of the {@link customElement}.
     * @param {String} style - Scoped CSS for the {@link customElement}.
     * @param {DocumentFragment} fragment - Fragment representing the
     * current {@link customElement}.
     * @param {HTMLElement} topNode - The for {@link customElement}.
     * @param {String} topNode - Scoped CSS for instances of
     * {@link customElement}.
     * @returns {HTMLElement} The new {@link topNode} (if any).
     */
    function injectElementStyle(name, style, fragment, topNode, instanceStyle) {
        var styleID = name + '-componentary-lib-style';
        var styleInjected = document.getElementById(styleID);
        var _style = style || null;
        var styleEl = null;
        var scopedEl = null;
        var className = name + '-componentary-lib-scoped';

        if(styleInjected !== null ||
           Object.prototype.toString.apply(_style) !== '[object String]') {
            return topNode;
        }

        styleEl = document.createElement('style');
        styleEl.id = styleID;

        // Dirty trick to make the CSS scope. Will probably break many
        // things.
        scopedEl = document.createElement('div');
        scopedEl.className = className;

        if(topNode.style) {
            scopedEl.style.display = topNode.style.display;
        }
        scopedEl.appendChild(topNode);

        topNode = scopedEl;
        fragment.appendChild(scopedEl);
        styleEl.textContent = CSSRulesScoped(style, scopedEl);
        if(instanceStyle && instanceStyle !== '') {
            styleEl.textContent += CSSRulesScoped(instanceStyle, scopedEl);
        }

        document.head.appendChild(styleEl);
        return topNode;
    }

    var customElements = {};

    /**
     * Compatibility fix.
     * @see http://stackoverflow.com/a/34292615
     */
    var range = document.createRange();
    range.selectNode(document.body);

    /**
     * Register a custom element.
     * @param {String} _name - The name to identify the custom
     * element.
     * @param {String} _template - The HTML template.
     * @param {Object} _proto - Callbacks for WebComponents.
     * @throws {Error} Various errors about a component
     * initialization.
     * @see http://thejackalofjavascript.com/web-components-future-web/#custELeLifeCyncle
     */
    var registerElement = function(_name, _template, _proto) {
        if(_name.constructor !== String || _name === '') {
            throw new Error('Cannot register the component. The name must be a String.');
        }
        if(_template.constructor !== String || _template === '') {
            throw new Error('Cannot register ' + _name +' component. The template must be a String.');
        }
        if(customElements[_name] !== undefined && customElements.hasOwnProperty(_name)) {
            throw new Error(_name + ' is an already registered component.');
        }

        var proto = _proto || {};

        Object.defineProperty(customElements, _name, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {
                template: _template,
                proto: proto
            }
        });

    };

    /**
     * Create an instance of a specified element by returning a
     * {@link DocumentFragment}. The responsability to inject the
     * fragment is left to the user. This element must be present in
     * {@link customElements}.
     * @param {String} _name - The unique name of the element.
     * @param {String} _style - Optional style that will be added to
     * the scoped. Note that once an element is created with that
     * attribute, it is no longer possible to add more style with
     * {@link createElement}.
     * @returns {DocumentFragment} - A document fragment containing
     * the element template and its attached callbacks.
     * @throws {Error} Component instantiation error.
     */
    var createElement = function(_name, _style) {
        if(!customElements.hasOwnProperty(_name)) {
            throw new Error('“' + _name + '” is not a registered component');
        }

        var customElement = customElements[_name];
        var customStyle = _style || '';
        var style = customElement.proto.style || undefined;

        // For compatibility reasons, it is the best way to write a String to an
        // Element.
        var fragment = range.createContextualFragment(customElement.template);

        var topNode = null;

        // Take the first Node (not a comment)
        for(var i=0, len=fragment.childNodes.length; i<len; i++) {
            if(fragment.childNodes[i].nodeType === Node.ELEMENT_NODE ||
               fragment.childNodes[i].nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                topNode = fragment.childNodes[i];
                break;
            }
        }
        // Verifies that there’s at least one node
        if(topNode === null) {
            throw new Error('The “' + _name + '” component doesn’t contain a valid node.');
        }

        topNode = injectElementStyle(_name, style, fragment, topNode, customStyle);

        // Note: using proto.createdCallback is useless here (as far
        // as I know) since it’s handled by the user.
        // Note: not useless at all if we want to hide some operations.
        var createdCallback = customElement.proto.createdCallback || {};

        if(createdCallback instanceof Function) {
            createdCallback.call(topNode);
        }

        // proto.attachedCallback
        // This callback is called when the element is attached to the
        // DOM (i.e. appendChild). It does so because when a
        // DocumentFragment is attached to the DOM, its content is
        // emptied (thus removing its childNodes).
        var attachedCb = customElement.proto.attachedCallback;
        if(attachedCb instanceof Function) {
            var observerAttached = new MutationObserver(function(mutations) {
                for(var i=0, len=mutations.length; i<len; i++) {
                    // When a DocumentFragment is appended, it becomes
                    // void
                    if(mutations[i].type === 'childList' && mutations[i].removedNodes[0] === topNode) {
                        // XXX: Is it doing anything?
                        mergeObjects(topNode, fragment);
                        attachedCb.call(topNode);
                    }
                }
            });
            observerAttached.observe(fragment, {childList: true});
        }

        // proto.attributeChangedCallback
        // This callback is called when an attribute of the container
        // (top most) element changed. It doesn’t include children
        // elements.
        var attributeChangedCb = customElement.proto.attributeChangedCallback;
        if(attributeChangedCb instanceof Function) {
            var observerAttr = new MutationObserver(function(mutations) {
                for(var i = 0, len=mutations.length; i<len; i++) {
                    if(mutations[i].type === 'attributes') {
                        attributeChangedCb.call(topNode);
                    }
                }
            });

            // Only observe attribute mutations
            observerAttr.observe(topNode, {attributes: true});
        }

        // proto.detachedCallback isn’t implemented

        return topNode;
    };

    return {
        registerElement: registerElement,
        createElement: createElement
    };
})();

// componentary.js<src> ends here

//# sourceMappingURL=componentary.js.map
