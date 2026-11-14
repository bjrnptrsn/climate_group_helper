(function(){"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var Pi;const Ge=globalThis,ft=Ge.ShadowRoot&&(Ge.ShadyCSS===void 0||Ge.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,bt=Symbol(),mo=new WeakMap;let po=class{constructor(t,o,i){if(this._$cssResult$=!0,i!==bt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=o}get styleSheet(){let t=this.o;const o=this.t;if(ft&&t===void 0){const i=o!==void 0&&o.length===1;i&&(t=mo.get(o)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&mo.set(o,t))}return t}toString(){return this.cssText}};const os=e=>new po(typeof e=="string"?e:e+"",void 0,bt),$=(e,...t)=>{const o=e.length===1?e[0]:t.reduce((i,s,a)=>i+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+e[a+1],e[0]);return new po(o,e,bt)},is=(e,t)=>{if(ft)e.adoptedStyleSheets=t.map(o=>o instanceof CSSStyleSheet?o:o.styleSheet);else for(const o of t){const i=document.createElement("style"),s=Ge.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=o.cssText,e.appendChild(i)}},fo=ft?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let o="";for(const i of t.cssRules)o+=i.cssText;return os(o)})(e):e;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:ss,defineProperty:as,getOwnPropertyDescriptor:rs,getOwnPropertyNames:ns,getOwnPropertySymbols:ls,getPrototypeOf:cs}=Object,F=globalThis,bo=F.trustedTypes,ds=bo?bo.emptyScript:"",gt=F.reactiveElementPolyfillSupport,Ce=(e,t)=>e,Ze={toAttribute(e,t){switch(t){case Boolean:e=e?ds:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let o=e;switch(t){case Boolean:o=e!==null;break;case Number:o=e===null?null:Number(e);break;case Object:case Array:try{o=JSON.parse(e)}catch{o=null}}return o}},_t=(e,t)=>!ss(e,t),go={attribute:!0,type:String,converter:Ze,reflect:!1,useDefault:!1,hasChanged:_t};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),F.litPropertyMetadata??(F.litPropertyMetadata=new WeakMap);let me=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,o=go){if(o.state&&(o.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((o=Object.create(o)).wrapped=!0),this.elementProperties.set(t,o),!o.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,o);s!==void 0&&as(this.prototype,t,s)}}static getPropertyDescriptor(t,o,i){const{get:s,set:a}=rs(this.prototype,t)??{get(){return this[o]},set(r){this[o]=r}};return{get:s,set(r){const n=s==null?void 0:s.call(this);a==null||a.call(this,r),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??go}static _$Ei(){if(this.hasOwnProperty(Ce("elementProperties")))return;const t=cs(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Ce("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Ce("properties"))){const o=this.properties,i=[...ns(o),...ls(o)];for(const s of i)this.createProperty(s,o[s])}const t=this[Symbol.metadata];if(t!==null){const o=litPropertyMetadata.get(t);if(o!==void 0)for(const[i,s]of o)this.elementProperties.set(i,s)}this._$Eh=new Map;for(const[o,i]of this.elementProperties){const s=this._$Eu(o,i);s!==void 0&&this._$Eh.set(s,o)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const o=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const s of i)o.unshift(fo(s))}else t!==void 0&&o.push(fo(t));return o}static _$Eu(t,o){const i=o.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(o=>this.enableUpdating=o),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(o=>o(this))}addController(t){var o;(this._$EO??(this._$EO=new Set)).add(t),this.renderRoot!==void 0&&this.isConnected&&((o=t.hostConnected)==null||o.call(t))}removeController(t){var o;(o=this._$EO)==null||o.delete(t)}_$E_(){const t=new Map,o=this.constructor.elementProperties;for(const i of o.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return is(t,this.constructor.elementStyles),t}connectedCallback(){var t;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$EO)==null||t.forEach(o=>{var i;return(i=o.hostConnected)==null?void 0:i.call(o)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(o=>{var i;return(i=o.hostDisconnected)==null?void 0:i.call(o)})}attributeChangedCallback(t,o,i){this._$AK(t,i)}_$ET(t,o){var a;const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){const r=(((a=i.converter)==null?void 0:a.toAttribute)!==void 0?i.converter:Ze).toAttribute(o,i.type);this._$Em=t,r==null?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,o){var a,r;const i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){const n=i.getPropertyOptions(s),d=typeof n.converter=="function"?{fromAttribute:n.converter}:((a=n.converter)==null?void 0:a.fromAttribute)!==void 0?n.converter:Ze;this._$Em=s;const u=d.fromAttribute(o,n.type);this[s]=u??((r=this._$Ej)==null?void 0:r.get(s))??u,this._$Em=null}}requestUpdate(t,o,i,s=!1,a){var r;if(t!==void 0){const n=this.constructor;if(s===!1&&(a=this[t]),i??(i=n.getPropertyOptions(t)),!((i.hasChanged??_t)(a,o)||i.useDefault&&i.reflect&&a===((r=this._$Ej)==null?void 0:r.get(t))&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,o,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,o,{useDefault:i,reflect:s,wrapped:a},r){i&&!(this._$Ej??(this._$Ej=new Map)).has(t)&&(this._$Ej.set(t,r??o??this[t]),a!==!0||r!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(o=void 0),this._$AL.set(t,o)),s===!0&&this._$Em!==t&&(this._$Eq??(this._$Eq=new Set)).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(o){Promise.reject(o)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[a,r]of this._$Ep)this[a]=r;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[a,r]of s){const{wrapped:n}=r,d=this[a];n!==!0||this._$AL.has(a)||d===void 0||this.C(a,void 0,r,d)}}let t=!1;const o=this._$AL;try{t=this.shouldUpdate(o),t?(this.willUpdate(o),(i=this._$EO)==null||i.forEach(s=>{var a;return(a=s.hostUpdate)==null?void 0:a.call(s)}),this.update(o)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(o)}willUpdate(t){}_$AE(t){var o;(o=this._$EO)==null||o.forEach(i=>{var s;return(s=i.hostUpdated)==null?void 0:s.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(o=>this._$ET(o,this[o]))),this._$EM()}updated(t){}firstUpdated(t){}};me.elementStyles=[],me.shadowRootOptions={mode:"open"},me[Ce("elementProperties")]=new Map,me[Ce("finalized")]=new Map,gt==null||gt({ReactiveElement:me}),(F.reactiveElementVersions??(F.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Oe=globalThis,_o=e=>e,qe=Oe.trustedTypes,vo=qe?qe.createPolicy("lit-html",{createHTML:e=>e}):void 0,yo="$lit$",K=`lit$${Math.random().toFixed(9).slice(2)}$`,wo="?"+K,us=`<${wo}>`,Q=document,Ee=()=>Q.createComment(""),Se=e=>e===null||typeof e!="object"&&typeof e!="function",vt=Array.isArray,hs=e=>vt(e)||typeof(e==null?void 0:e[Symbol.iterator])=="function",yt=`[ 	
\f\r]`,Me=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ko=/-->/g,$o=/>/g,ee=RegExp(`>|${yt}(?:([^\\s"'>=/]+)(${yt}*=${yt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),xo=/'/g,Ao=/"/g,Co=/^(?:script|style|textarea|title)$/i,Oo=e=>(t,...o)=>({_$litType$:e,strings:t,values:o}),c=Oo(1),W=Oo(2),D=Symbol.for("lit-noChange"),l=Symbol.for("lit-nothing"),Eo=new WeakMap,te=Q.createTreeWalker(Q,129);function So(e,t){if(!vt(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return vo!==void 0?vo.createHTML(t):t}const ms=(e,t)=>{const o=e.length-1,i=[];let s,a=t===2?"<svg>":t===3?"<math>":"",r=Me;for(let n=0;n<o;n++){const d=e[n];let u,f,h=-1,g=0;for(;g<d.length&&(r.lastIndex=g,f=r.exec(d),f!==null);)g=r.lastIndex,r===Me?f[1]==="!--"?r=ko:f[1]!==void 0?r=$o:f[2]!==void 0?(Co.test(f[2])&&(s=RegExp("</"+f[2],"g")),r=ee):f[3]!==void 0&&(r=ee):r===ee?f[0]===">"?(r=s??Me,h=-1):f[1]===void 0?h=-2:(h=r.lastIndex-f[2].length,u=f[1],r=f[3]===void 0?ee:f[3]==='"'?Ao:xo):r===Ao||r===xo?r=ee:r===ko||r===$o?r=Me:(r=ee,s=void 0);const y=r===ee&&e[n+1].startsWith("/>")?" ":"";a+=r===Me?d+us:h>=0?(i.push(u),d.slice(0,h)+yo+d.slice(h)+K+y):d+K+(h===-2?n:y)}return[So(e,a+(e[o]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]};class Te{constructor({strings:t,_$litType$:o},i){let s;this.parts=[];let a=0,r=0;const n=t.length-1,d=this.parts,[u,f]=ms(t,o);if(this.el=Te.createElement(u,i),te.currentNode=this.el.content,o===2||o===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(s=te.nextNode())!==null&&d.length<n;){if(s.nodeType===1){if(s.hasAttributes())for(const h of s.getAttributeNames())if(h.endsWith(yo)){const g=f[r++],y=s.getAttribute(h).split(K),b=/([.?@])?(.*)/.exec(g);d.push({type:1,index:a,name:b[2],strings:y,ctor:b[1]==="."?fs:b[1]==="?"?bs:b[1]==="@"?gs:Ye}),s.removeAttribute(h)}else h.startsWith(K)&&(d.push({type:6,index:a}),s.removeAttribute(h));if(Co.test(s.tagName)){const h=s.textContent.split(K),g=h.length-1;if(g>0){s.textContent=qe?qe.emptyScript:"";for(let y=0;y<g;y++)s.append(h[y],Ee()),te.nextNode(),d.push({type:2,index:++a});s.append(h[g],Ee())}}}else if(s.nodeType===8)if(s.data===wo)d.push({type:2,index:a});else{let h=-1;for(;(h=s.data.indexOf(K,h+1))!==-1;)d.push({type:7,index:a}),h+=K.length-1}a++}}static createElement(t,o){const i=Q.createElement("template");return i.innerHTML=t,i}}function pe(e,t,o=e,i){var r,n;if(t===D)return t;let s=i!==void 0?(r=o._$Co)==null?void 0:r[i]:o._$Cl;const a=Se(t)?void 0:t._$litDirective$;return(s==null?void 0:s.constructor)!==a&&((n=s==null?void 0:s._$AO)==null||n.call(s,!1),a===void 0?s=void 0:(s=new a(e),s._$AT(e,o,i)),i!==void 0?(o._$Co??(o._$Co=[]))[i]=s:o._$Cl=s),s!==void 0&&(t=pe(e,s._$AS(e,t.values),s,i)),t}class ps{constructor(t,o){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=o}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:o},parts:i}=this._$AD,s=((t==null?void 0:t.creationScope)??Q).importNode(o,!0);te.currentNode=s;let a=te.nextNode(),r=0,n=0,d=i[0];for(;d!==void 0;){if(r===d.index){let u;d.type===2?u=new He(a,a.nextSibling,this,t):d.type===1?u=new d.ctor(a,d.name,d.strings,this,t):d.type===6&&(u=new _s(a,this,t)),this._$AV.push(u),d=i[++n]}r!==(d==null?void 0:d.index)&&(a=te.nextNode(),r++)}return te.currentNode=Q,s}p(t){let o=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,o),o+=i.strings.length-2):i._$AI(t[o])),o++}}class He{get _$AU(){var t;return((t=this._$AM)==null?void 0:t._$AU)??this._$Cv}constructor(t,o,i,s){this.type=2,this._$AH=l,this._$AN=void 0,this._$AA=t,this._$AB=o,this._$AM=i,this.options=s,this._$Cv=(s==null?void 0:s.isConnected)??!0}get parentNode(){let t=this._$AA.parentNode;const o=this._$AM;return o!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=o.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,o=this){t=pe(this,t,o),Se(t)?t===l||t==null||t===""?(this._$AH!==l&&this._$AR(),this._$AH=l):t!==this._$AH&&t!==D&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):hs(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==l&&Se(this._$AH)?this._$AA.nextSibling.data=t:this.T(Q.createTextNode(t)),this._$AH=t}$(t){var a;const{values:o,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=Te.createElement(So(i.h,i.h[0]),this.options)),i);if(((a=this._$AH)==null?void 0:a._$AD)===s)this._$AH.p(o);else{const r=new ps(s,this),n=r.u(this.options);r.p(o),this.T(n),this._$AH=r}}_$AC(t){let o=Eo.get(t.strings);return o===void 0&&Eo.set(t.strings,o=new Te(t)),o}k(t){vt(this._$AH)||(this._$AH=[],this._$AR());const o=this._$AH;let i,s=0;for(const a of t)s===o.length?o.push(i=new He(this.O(Ee()),this.O(Ee()),this,this.options)):i=o[s],i._$AI(a),s++;s<o.length&&(this._$AR(i&&i._$AB.nextSibling,s),o.length=s)}_$AR(t=this._$AA.nextSibling,o){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,o);t!==this._$AB;){const s=_o(t).nextSibling;_o(t).remove(),t=s}}setConnected(t){var o;this._$AM===void 0&&(this._$Cv=t,(o=this._$AP)==null||o.call(this,t))}}class Ye{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,o,i,s,a){this.type=1,this._$AH=l,this._$AN=void 0,this.element=t,this.name=o,this._$AM=s,this.options=a,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=l}_$AI(t,o=this,i,s){const a=this.strings;let r=!1;if(a===void 0)t=pe(this,t,o,0),r=!Se(t)||t!==this._$AH&&t!==D,r&&(this._$AH=t);else{const n=t;let d,u;for(t=a[0],d=0;d<a.length-1;d++)u=pe(this,n[i+d],o,d),u===D&&(u=this._$AH[d]),r||(r=!Se(u)||u!==this._$AH[d]),u===l?t=l:t!==l&&(t+=(u??"")+a[d+1]),this._$AH[d]=u}r&&!s&&this.j(t)}j(t){t===l?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class fs extends Ye{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===l?void 0:t}}class bs extends Ye{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==l)}}class gs extends Ye{constructor(t,o,i,s,a){super(t,o,i,s,a),this.type=5}_$AI(t,o=this){if((t=pe(this,t,o,0)??l)===D)return;const i=this._$AH,s=t===l&&i!==l||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==l&&(i===l||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var o;typeof this._$AH=="function"?this._$AH.call(((o=this.options)==null?void 0:o.host)??this.element,t):this._$AH.handleEvent(t)}}class _s{constructor(t,o,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=o,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){pe(this,t)}}const wt=Oe.litHtmlPolyfillSupport;wt==null||wt(Te,He),(Oe.litHtmlVersions??(Oe.litHtmlVersions=[])).push("3.3.3");const vs=(e,t,o)=>{const i=(o==null?void 0:o.renderBefore)??t;let s=i._$litPart$;if(s===void 0){const a=(o==null?void 0:o.renderBefore)??null;i._$litPart$=s=new He(t.insertBefore(Ee(),a),a,void 0,o??{})}return s._$AI(e),s};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const oe=globalThis;let x=class extends me{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var o;const t=super.createRenderRoot();return(o=this.renderOptions).renderBefore??(o.renderBefore=t.firstChild),t}update(t){const o=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=vs(o,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return D}};x._$litElement$=!0,x.finalized=!0,(Pi=oe.litElementHydrateSupport)==null||Pi.call(oe,{LitElement:x});const kt=oe.litElementPolyfillSupport;kt==null||kt({LitElement:x}),(oe.litElementVersions??(oe.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ys={attribute:!0,type:String,converter:Ze,reflect:!1,hasChanged:_t},ws=(e=ys,t,o)=>{const{kind:i,metadata:s}=o;let a=globalThis.litPropertyMetadata.get(s);if(a===void 0&&globalThis.litPropertyMetadata.set(s,a=new Map),i==="setter"&&((e=Object.create(e)).wrapped=!0),a.set(o.name,e),i==="accessor"){const{name:r}=o;return{set(n){const d=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,d,e,!0,n)},init(n){return n!==void 0&&this.C(r,void 0,e,n),n}}}if(i==="setter"){const{name:r}=o;return function(n){const d=this[r];t.call(this,n),this.requestUpdate(r,d,e,!0,n)}}throw Error("Unsupported decorator location: "+i)};function m(e){return(t,o)=>typeof o=="object"?ws(e,t,o):((i,s,a)=>{const r=s.hasOwnProperty(a);return s.constructor.createProperty(a,i),r?Object.getOwnPropertyDescriptor(s,a):void 0})(e,t,o)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function M(e){return m({...e,state:!0,attribute:!1})}const Mo=document.querySelector("home-assistant")&&!customElements.get("home-assistant")?customElements.whenDefined("home-assistant"):void 0,To=(e,t)=>{customElements.get(e)||customElements.define(e,t)},E=e=>t=>{Mo?Mo.then(()=>To(e,t)):To(e,t)},ks=e=>{window.customCards=window.customCards||[],window.customCards.some(t=>t.type===e.type)||window.customCards.push(e)},fe=270,Ho=360-fe/2-90,S=145,$t=320,Lo=$t/2,xt=S*2*Math.PI*fe/360,Je=((e,t)=>{const o=e/180*Math.PI,i=t/180*Math.PI,s=i-o,a=S*Math.cos(o),r=S*Math.sin(o),n=S*Math.cos(i),d=S*Math.sin(i);return`M ${a} ${r} A ${S} ${S} 0 ${s>Math.PI?1:0} ${s>0?1:0} ${n} ${d}`})(0,fe),At=(e,t,o)=>o===t?0:(e-t)/(o-t),Xe=(e,t,o)=>At(e,t,o)*fe,$s=(e,t,o,i)=>{const s=At(e,o,i),a=At(t,o,i),r=Math.max((a-s)*xt,0);return[`${r} ${xt-r}`,`-${s*xt-.5}`]},Qe=(e,t,o,i)=>{const s=Math.round(e/i)*i;return Math.min(o,Math.max(t,Number(s.toFixed(4))))},xs=(e,t,o)=>{if(!o.width)return 0;const i=2*(e-o.left-o.width/2)/o.width,s=2*(t-o.top-o.height/2)/o.height,a=Math.atan2(s,i)*180/Math.PI,r=(360-fe)/2,n=(a+r-Ho+360)%360-r;return Math.min(1,Math.max(0,n/fe))},As=(e,t,o,i)=>i?Math.abs(e-t)<=Math.abs(e-o)?"low":"high":"value",Cs=(e,t,o,i)=>o?e<=t:i==="end"?t<=e:i==="start"?e<=t:!1;var Os=Object.defineProperty,Es=Object.getOwnPropertyDescriptor,A=(e,t,o,i)=>{for(var s=i>1?void 0:i?Es(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&Os(t,o,s),s};const Do=["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","Home","End"];let k=class extends x{constructor(){super(...arguments),this.min=5,this.max=35,this.step=.5,this.dual=!1,this.disabled=!1,this.mode="full",this.origin=0,this.inactive=!1,this.bound="low",this._gripTouch={handleEvent:e=>{this.disabled||e.preventDefault()},passive:!1}}willUpdate(e){e.has("value")&&this._active!=="value"&&(this._localValue=this.value),e.has("low")&&this._active!=="low"&&(this._localLow=this.low),e.has("high")&&this._active!=="high"&&(this._localHigh=this.high)}_valueFromEvent(e){var o;const t=(o=this._svg)==null?void 0:o.getBoundingClientRect();return t?this.min+xs(e.clientX,e.clientY,t)*(this.max-this.min):this.min}_setActiveValue(e){const t=Qe(e,this.min,this.max,this.step);this._active==="low"?this._localLow=Math.min(t,this._localHigh??this.max):this._active==="high"?this._localHigh=Math.max(t,this._localLow??this.min):this._localValue=t}_activeValue(){if(this._active==="low")return this._localLow;if(this._active==="high")return this._localHigh;if(this._active==="value")return this._localValue}_committedValue(){return this._active==="low"?this.low:this._active==="high"?this.high:this.value}_commit(){this._active&&(this._activeValue()!==this._committedValue()&&this._emit("changed"),this._active=void 0)}_emit(e){if(!this._active)return;const t=e==="changed"?this._activeValue():void 0;this.dispatchEvent(new CustomEvent(`${this._active}-${e}`,{detail:{value:t},bubbles:!0,composed:!0}))}_onPointerDown(e){if(this.disabled||this._active||e.pointerType==="touch")return;const t=this._valueFromEvent(e);this._active=As(t,this._localLow??this.min,this._localHigh??this.max,this.dual),this._pointerId=e.pointerId,this._setActiveValue(t),e.currentTarget.setPointerCapture(e.pointerId),this._emit("changing")}_onGripDown(e,t){this.disabled||this._active||(this._active=t,this._pointerId=e.pointerId,e.currentTarget.setPointerCapture(e.pointerId),this._emit("changing"))}_onPointerMove(e){!this._active||e.pointerId!==this._pointerId||(this._setActiveValue(this._valueFromEvent(e)),this._emit("changing"))}_onPointerUp(e){!this._active||e.pointerId!==this._pointerId||(e.currentTarget.releasePointerCapture(e.pointerId),this._pointerId=void 0,this._commit())}_onPointerCancel(e){!this._active||e.pointerId!==this._pointerId||(this._pointerId=void 0,this._active==="low"?this._localLow=this.low:this._active==="high"?this._localHigh=this.high:this._localValue=this.value,this._active=void 0)}_onKeyDown(e){if(this.disabled||this._pointerId!==void 0||!Do.includes(e.code))return;e.preventDefault(),this._active||(this._active=this.dual?this.bound:"value");const t=this._activeValue()??this.min;switch(e.code){case"ArrowRight":case"ArrowUp":this._setActiveValue(t+this.step);break;case"ArrowLeft":case"ArrowDown":this._setActiveValue(t-this.step);break;case"Home":this._setActiveValue(this.min);break;case"End":this._setActiveValue(this.max);break}this._emit("changing")}_onKeyUp(e){this._pointerId!==void 0||!Do.includes(e.code)||this._commit()}_onBlur(){this._pointerId===void 0&&this._commit()}_fill(e,t,o,i=!1){const[s,a]=$s(e,t,this.min,this.max);return W`
      <path
        class="fill ${o}${i?" active":""}"
        d=${Je}
        stroke-dasharray=${s}
        stroke-dashoffset=${a}
      />
    `}_originFill(e){const t=Math.min(this.max,Math.max(this.min,this.origin));return e===t?l:this._fill(Math.min(t,e),Math.max(t,e),"value")}_handle(e,t){return W`
      <circle
        class="handle-ring ${t}"
        transform="rotate(${Xe(e,this.min,this.max)} 0 0)"
        cx=${S}
        cy="0"
        r="12"
      />
      <circle
        class="handle"
        transform="rotate(${Xe(e,this.min,this.max)} 0 0)"
        cx=${S}
        cy="0"
        r="9"
      />
    `}_grip(e,t){return W`<circle
      class="grip ${t}"
      transform="rotate(${Xe(e,this.min,this.max)} 0 0)"
      cx=${S}
      cy="0"
      r="24"
      @touchstart=${this._gripTouch}
      @pointerdown=${o=>this._onGripDown(o,t)}
      @pointermove=${this._onPointerMove}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerCancel}
    />`}_glass(){const e=(S-12)/(S+12);return W`
      <defs>
        <radialGradient
          id="cgh-glass"
          gradientUnits="userSpaceOnUse"
          cx="0"
          cy="0"
          r=${S+12}
        >
          <stop offset=${e} stop-color="#fff" stop-opacity="0.09" />
          <stop offset=${e+.012} stop-color="#fff" stop-opacity="0" />
          <stop offset="0.91" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.96" stop-color="#fff" stop-opacity="0.1" />
          <stop offset="0.99" stop-color="#fff" stop-opacity="0.04" />
          <stop offset="1" stop-color="#fff" stop-opacity="0.09" />
        </radialGradient>
      </defs>
      <path class="glass" d=${Je} />
    `}_currentMarker(e){return W`<circle
      class="current"
      transform="rotate(${Xe(e,this.min,this.max)} 0 0)"
      cx=${S}
      cy="0"
      r="4"
    />`}render(){const e=this.current,t=e!=null&&e>=this.min&&e<=this.max,o=t&&!this.inactive,i=this.dual?this._localLow:this._localValue,s=this.dual?this._localHigh:void 0,a=o&&i!=null&&Cs(e,i,this.dual,this.mode),r=o&&s!=null&&s<=e;return c`
      <svg
        viewBox="0 0 ${$t} ${$t}"
        class="slider"
        @keydown=${this._onKeyDown}
        @keyup=${this._onKeyUp}
        @blur=${this._onBlur}
        tabindex="0"
        role="slider"
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-valuenow=${(this.dual&&this.bound==="high"?s:i)??l}
        aria-disabled=${this.disabled}
      >
        <g
          class=${this.inactive?"inactive":""}
          transform="translate(${Lo} ${Lo}) rotate(${Ho})"
        >
          <path class="track" d=${Je} />
          ${this.dual?W`
                  ${i!=null?this._fill(this.min,i,"low"):l}
                  ${s!=null?this._fill(s,this.max,"high"):l}
                  ${a?this._fill(e,i,"low",!0):l}
                  ${r?this._fill(s,e,"high",!0):l}
                  ${this._glass()}
                  ${t?this._currentMarker(e):l}
                  ${i!=null?this._handle(i,"low"):l}
                  ${s!=null?this._handle(s,"high"):l}
                `:W`
                  ${i!=null?this.mode==="end"?this._fill(i,this.max,"value"):this.mode==="full"?this._fill(this.min,this.max,"value"):this.mode==="origin"?this._originFill(i):this._fill(this.min,i,"value"):l}
                  ${a?this.mode==="end"?this._fill(i,e,"value",!0):this._fill(e,i,"value",!0):l}
                  ${this._glass()}
                  ${t?this._currentMarker(e):l}
                  ${i!=null?this._handle(i,"value"):l}
                `}
          <path
            class="interaction"
            d=${Je}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerCancel}
          />
          ${this.dual?W`
                  ${i!=null?this._grip(i,"low"):l}
                  ${s!=null?this._grip(s,"high"):l}
                `:i!=null?this._grip(i,"value"):l}
        </g>
      </svg>
    `}firstUpdated(){this._svg=this.renderRoot.querySelector("svg")??void 0}};k.styles=$`
    :host {
      display: block;
      --cgh-slider-track: var(--primary-text-color);
    }
    .slider {
      width: 100%;
      display: block;
      outline: none;
    }
    .interaction {
      stroke: transparent;
      stroke-width: 48;
      stroke-linecap: round;
      pointer-events: stroke;
      cursor: pointer;
    }
    /* The only place a finger can grab; the scroll itself is stopped in
       touchstart, as mobile browsers ignore this on SVG elements. */
    .grip {
      fill: transparent;
      pointer-events: all;
      touch-action: none;
      cursor: grab;
    }
    :host([disabled]) .interaction {
      cursor: default;
    }
    :host([disabled]) .grip {
      pointer-events: none;
    }
    g {
      fill: none;
    }
    /* The text colour, faint — like the tiles' glass surface, so the
       background shows through instead of a flat grey. */
    .track {
      stroke: var(--cgh-slider-track);
      stroke-opacity: 0.07;
      stroke-width: 24;
      stroke-linecap: round;
    }
    .fill {
      stroke-width: 24;
      stroke-linecap: round;
      opacity: 0.5;
      transition: opacity 180ms ease-in-out;
    }
    .fill.active {
      opacity: 1;
    }
    .fill.value {
      stroke: var(--cgh-slider-color, var(--primary-color));
    }
    .fill.low {
      stroke: var(--cgh-slider-low, var(--state-climate-heat-color, #ff5722));
    }
    .fill.high {
      stroke: var(--cgh-slider-high, var(--state-climate-cool-color, #2196f3));
    }
    .glass {
      stroke: url(#cgh-glass);
      stroke-width: 24;
      stroke-linecap: round;
      pointer-events: none;
    }
    .handle {
      fill: #fff;
    }
    .handle-ring {
      filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.35));
    }
    .handle-ring.value {
      fill: var(--cgh-slider-color, var(--primary-color));
    }
    .handle-ring.low {
      fill: var(--cgh-slider-low, var(--state-climate-heat-color, #ff5722));
    }
    .handle-ring.high {
      fill: var(--cgh-slider-high, var(--state-climate-cool-color, #2196f3));
    }
    .inactive .handle-ring {
      fill: var(--state-inactive-color, var(--disabled-color, #9e9e9e));
    }
    .current {
      fill: var(--primary-text-color);
      opacity: 0.5;
    }
    .inactive .fill {
      opacity: 0;
    }
  `,A([m({type:Number})],k.prototype,"min",2),A([m({type:Number})],k.prototype,"max",2),A([m({type:Number})],k.prototype,"step",2),A([m({type:Number})],k.prototype,"value",2),A([m({type:Number})],k.prototype,"low",2),A([m({type:Number})],k.prototype,"high",2),A([m({type:Number})],k.prototype,"current",2),A([m({type:Boolean})],k.prototype,"dual",2),A([m({type:Boolean,reflect:!0})],k.prototype,"disabled",2),A([m({type:String})],k.prototype,"mode",2),A([m({type:Number})],k.prototype,"origin",2),A([m({type:Boolean,reflect:!0})],k.prototype,"inactive",2),A([m({type:String})],k.prototype,"bound",2),A([M()],k.prototype,"_localValue",2),A([M()],k.prototype,"_localLow",2),A([M()],k.prototype,"_localHigh",2),A([M()],k.prototype,"_active",2),k=A([E("cgh-circular-slider")],k);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ie={ATTRIBUTE:1,PROPERTY:3,BOOLEAN_ATTRIBUTE:4},zo=e=>(...t)=>({_$litDirective$:e,values:t});let Po=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,o,i){this._$Ct=t,this._$AM=o,this._$Ci=i}_$AS(t,o){return this.update(t,o)}update(t,o){return this.render(...o)}};/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Vo="important",Ss=" !"+Vo,se=zo(class extends Po{constructor(e){var t;if(super(e),e.type!==ie.ATTRIBUTE||e.name!=="style"||((t=e.strings)==null?void 0:t.length)>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,o)=>{const i=e[o];return i==null?t:t+`${o=o.includes("-")?o:o.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${i};`},"")}update(e,[t]){const{style:o}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(const i of this.ft)t[i]==null&&(this.ft.delete(i),i.includes("-")?o.removeProperty(i):o[i]=null);for(const i in t){const s=t[i];if(s!=null){this.ft.add(i);const a=typeof s=="string"&&s.endsWith(Ss);i.includes("-")||a?o.setProperty(i,a?s.slice(0,-11):s,a?Vo:""):o[i]=s}}return D}}),et={en:{"action.cooling":"Cooling","action.drying":"Drying","action.fan":"Fan","action.heating":"Heating","action.idle":"Idle","action.off":"Off","block.presence":"Away","block.switch":"Main switch: Off","block.switch_release":"Main switch: Manual control","block.switch_temperature":"Main switch: Temperature","block.window":"Window open","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} until {time}","card.entity_not_found":"Entity not found: {entity}","card.more_info":"More info","common.decrease":"Decrease","common.humidity":"Humidity","common.increase":"Increase","common.temperature":"Temperature","demo.group":"Demo group","demo.room.bathroom":"Bathroom","demo.room.bedroom":"Bedroom","demo.room.kitchen":"Kitchen","demo.room.living_room":"Living room","demo.schedule":"Demo schedule","demo.slot":"Demo slot","demo.vacation":"Vacation","editor.advanced_note":"Main switch, group offset, boost and reset need “Advanced Features”.","editor.battery":"Battery","editor.boost":"Boost button","editor.boost_absolute":"Absolute temperature","editor.boost_duration":"Duration","editor.boost_invalid":"Incomplete — the card shows no boost button.","editor.boost_relative":"Relative to the target","editor.control.buttons":"−/+ buttons","editor.control.slider":"Slider","editor.control.toggle":"View switch","editor.controls":"Controls","editor.custom_name":"Custom name","editor.demo":"Demo mode (synthetic data; no entity needed)","editor.group_entity":"Group entity","editor.header":"Header","editor.main_switch":"Main switch","editor.more_info":"Menu button","editor.name":"Name","editor.offset":"Group offset","editor.reset":"Reset button","editor.reset_empty":"No option selected — the card shows no reset button.","editor.section.badges":"Badges","editor.section.deviations":"Deviations","editor.section.panel":"Panel","editor.status_cell":"Status cell","editor.title_placeholder":"Use the entity name","feature.calibration":"Calibration","feature.hold":"Hold","feature.isolation":"Isolation","feature.presence":"Presence","feature.schedule":"Schedule","feature.sync":"Sync","feature.window":"Window","humidity.target":"Humidity target","main_switch.label":"Main switch","member.details":"Show details of {name}","member.low_battery":"Low battery","member.unavailable":"Unavailable","mode.auto":"Auto","mode.cool":"Cool","mode.dry":"Dry","mode.fan_only":"Fan only","mode.heat":"Heat","mode.heat_cool":"Heat/Cool","mode.off":"Off","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass schedule","reset.fallback":"Schedule fallback","reset.label":"Reset","reset.offset":"Temperature offset","reset.presets":"Group presets","reset.schedule":"Main schedule","source.manual":"Manual","source.mirror":"Mirror","source.schedule":"Schedule","source.sync":"Sync","source.window":"Window","status.active":"Active","status.blocking_for":"for {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergence","status.hold":"Hold {minutes} min","status.isolated":"{count} isolated","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} with low battery","status.next":"Next {time}","status.no_deviations":"No deviations","status.offset":"Offset {value}","status.oob":"{count} out of bounds","status.via_service":"Service","tile.fan":"Fan mode","tile.mode":"Mode","tile.preset":"Preset","tile.swing":"Swing mode","tile.swing_horizontal":"Horizontal swing"},cs:{"action.cooling":"Chlazení","action.drying":"Odvlhčování","action.fan":"Ventilátor","action.heating":"Topení","action.idle":"Nečinný","action.off":"Vypnuto","block.presence":"Nepřítomen","block.switch":"Hlavní vypínač: Vypnuto","block.switch_release":"Hlavní vypínač: Ruční ovládání","block.switch_temperature":"Hlavní vypínač: Teplota","block.window":"Okno otevřeno","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} do {time}","card.entity_not_found":"Entita nenalezena: {entity}","card.more_info":"Více informací","common.decrease":"Snížit","common.humidity":"Vlhkost","common.increase":"Zvýšit","common.temperature":"Teplota","demo.group":"Demo skupina","demo.room.bathroom":"Koupelna","demo.room.bedroom":"Ložnice","demo.room.kitchen":"Kuchyně","demo.room.living_room":"Obývací pokoj","demo.schedule":"Demo plán","demo.slot":"Demo úsek","demo.vacation":"Dovolená","editor.advanced_note":"Hlavní vypínač, offset skupiny, boost a obnovení vyžadují „Pokročilé funkce“.","editor.battery":"Baterie","editor.boost":"Tlačítko boostu","editor.boost_absolute":"Absolutní teplota","editor.boost_duration":"Doba trvání","editor.boost_invalid":"Neúplné — karta nezobrazí tlačítko boostu.","editor.boost_relative":"Relativně k cíli","editor.control.buttons":"Tlačítka −/+","editor.control.slider":"Posuvník","editor.control.toggle":"Přepínač zobrazení","editor.controls":"Ovládací prvky","editor.custom_name":"Vlastní název","editor.demo":"Režim ukázky (syntetická data; není potřeba entita)","editor.group_entity":"Entita skupiny","editor.header":"Záhlaví","editor.main_switch":"Hlavní vypínač","editor.more_info":"Tlačítko nabídky","editor.name":"Název","editor.offset":"Offset skupiny","editor.reset":"Tlačítko obnovení","editor.reset_empty":"Není vybrána žádná možnost — karta nezobrazí tlačítko obnovení.","editor.section.badges":"Odznaky","editor.section.deviations":"Odchylky","editor.section.panel":"Panel","editor.status_cell":"Stavová buňka","editor.title_placeholder":"Použít název entity","feature.calibration":"Kalibrace","feature.hold":"Podržet","feature.isolation":"Izolace","feature.presence":"Přítomnost","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cílová vlhkost","main_switch.label":"Hlavní vypínač","member.details":"Zobrazit podrobnosti: {name}","member.low_battery":"Slabá baterie","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chlazení","mode.dry":"Odvlhčování","mode.fan_only":"Pouze ventilátor","mode.heat":"Topení","mode.heat_cool":"Topení/Chlazení","mode.off":"Vypnuto","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Obchozí plán","reset.fallback":"Náhradní plán","reset.label":"Obnovit","reset.offset":"Teplotní offset","reset.presets":"Předvolby skupiny","reset.schedule":"Hlavní plán","source.manual":"Ručně","source.mirror":"Zrcadlení","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Aktivní","status.blocking_for":"už {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchylka","status.hold":"Podržet {minutes} min","status.isolated":"{count} izolováno","status.layer_bypass":"Obchvat","status.layer_fallback":"Náhradní","status.low_battery":"{count} se slabou baterií","status.next":"Další {time}","status.no_deviations":"Žádné odchylky","status.offset":"Offset {value}","status.oob":"{count} mimo rozsah","status.via_service":"Služba","tile.fan":"Režim ventilátoru","tile.mode":"Režim","tile.preset":"Předvolba","tile.swing":"Režim natáčení","tile.swing_horizontal":"Vodorovné natáčení"},da:{"action.cooling":"Køler","action.drying":"Affugter","action.fan":"Ventilator","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Slukket","block.presence":"Ikke hjemme","block.switch":"Hovedafbryder: Slukket","block.switch_release":"Hovedafbryder: Manuel styring","block.switch_temperature":"Hovedafbryder: Temperatur","block.window":"Vindue åbent","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} til {time}","card.entity_not_found":"Enhed ikke fundet: {entity}","card.more_info":"Mere info","common.decrease":"Reducér","common.humidity":"Luftfugtighed","common.increase":"Forøg","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.room.bathroom":"Badeværelse","demo.room.bedroom":"Soveværelse","demo.room.kitchen":"Køkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrum","demo.vacation":"Ferie","editor.advanced_note":"Hovedafbryder, gruppeforskydning, boost og nulstilling kræver „Avancerede funktioner“.","editor.battery":"Batteri","editor.boost":"Boost-knap","editor.boost_absolute":"Absolut temperatur","editor.boost_duration":"Varighed","editor.boost_invalid":"Ufuldstændig — kortet viser ingen boost-knap.","editor.boost_relative":"I forhold til målet","editor.control.buttons":"−/+-knapper","editor.control.slider":"Skyder","editor.control.toggle":"Skift visning","editor.controls":"Betjening","editor.custom_name":"Eget navn","editor.demo":"Demotilstand (syntetiske data; ingen enhed nødvendig)","editor.group_entity":"Gruppeenhed","editor.header":"Sidehoved","editor.main_switch":"Hovedafbryder","editor.more_info":"Menuknap","editor.name":"Navn","editor.offset":"Gruppeforskydning","editor.reset":"Nulstillingsknap","editor.reset_empty":"Ingen mulighed valgt — kortet viser ingen nulstillingsknap.","editor.section.badges":"Mærkater","editor.section.deviations":"Afvigelser","editor.section.panel":"Panel","editor.status_cell":"Statusfelt","editor.title_placeholder":"Brug enhedens navn","feature.calibration":"Kalibrering","feature.hold":"Hold","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindue","humidity.target":"Ønsket luftfugtighed","main_switch.label":"Hovedafbryder","member.details":"Vis detaljer for {name}","member.low_battery":"Lavt batteri","member.unavailable":"Utilgængelig","mode.auto":"Automatisk","mode.cool":"Køling","mode.dry":"Affugtning","mode.fan_only":"Kun ventilator","mode.heat":"Varme","mode.heat_cool":"Varme/Køling","mode.off":"Slukket","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-tidsplan","reset.fallback":"Tidsplan-fallback","reset.label":"Nulstil","reset.offset":"Temperaturforskydning","reset.presets":"Gruppeforudindstillinger","reset.schedule":"Hovedtidsplan","source.manual":"Manuel","source.mirror":"Spejling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindue","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} afvigelse","status.hold":"Hold {minutes} min","status.isolated":"{count} isoleret","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} med lavt batteri","status.next":"Næste {time}","status.no_deviations":"Ingen afvigelser","status.offset":"Offset {value}","status.oob":"{count} uden for området","status.via_service":"Tjeneste","tile.fan":"Ventilatortilstand","tile.mode":"Tilstand","tile.preset":"Forudindstilling","tile.swing":"Svingtilstand","tile.swing_horizontal":"Vandret sving"},de:{"action.cooling":"Kühlen","action.drying":"Trocknen","action.fan":"Lüfter","action.heating":"Heizen","action.idle":"Bereit","action.off":"Aus","block.presence":"Abwesend","block.switch":"Hauptschalter: Aus","block.switch_release":"Hauptschalter: Handbetrieb","block.switch_temperature":"Hauptschalter: Temperatur","block.window":"Fenster offen","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} bis {time}","card.entity_not_found":"Entität nicht gefunden: {entity}","card.more_info":"Mehr Infos","common.decrease":"Verringern","common.humidity":"Luftfeuchte","common.increase":"Erhöhen","common.temperature":"Temperatur","demo.group":"Demo-Gruppe","demo.room.bathroom":"Bad","demo.room.bedroom":"Schlafzimmer","demo.room.kitchen":"Küche","demo.room.living_room":"Wohnzimmer","demo.schedule":"Demo-Zeitplan","demo.slot":"Demo-Zeitblock","demo.vacation":"Urlaub","editor.advanced_note":"Hauptschalter, Gruppen-Offset, Boost und Reset brauchen „Erweiterte Funktionen“.","editor.battery":"Batterie","editor.boost":"Boost-Schaltfläche","editor.boost_absolute":"Absolute Temperatur","editor.boost_duration":"Dauer","editor.boost_invalid":"Unvollständig — die Karte zeigt keine Boost-Schaltfläche.","editor.boost_relative":"Relativ zum Ziel","editor.control.buttons":"−/+-Tasten","editor.control.slider":"Schieberegler","editor.control.toggle":"Ansichtsumschalter","editor.controls":"Bedienelemente","editor.custom_name":"Eigener Name","editor.demo":"Demo-Modus (synthetische Daten; keine Entität nötig)","editor.group_entity":"Gruppen-Entität","editor.header":"Kopfzeile","editor.main_switch":"Hauptschalter","editor.more_info":"Menü-Schaltfläche","editor.name":"Name","editor.offset":"Gruppen-Offset","editor.reset":"Reset-Schaltfläche","editor.reset_empty":"Keine Option gewählt — die Karte zeigt keine Reset-Schaltfläche.","editor.section.badges":"Badges","editor.section.deviations":"Abweichungen","editor.section.panel":"Panel","editor.status_cell":"Status-Zelle","editor.title_placeholder":"Entitätsname verwenden","feature.calibration":"Kalibrierung","feature.hold":"Halten","feature.isolation":"Isolation","feature.presence":"Präsenz","feature.schedule":"Zeitplan","feature.sync":"Sync","feature.window":"Fenster","humidity.target":"Feuchte-Sollwert","main_switch.label":"Hauptschalter","member.details":"Details zu {name} anzeigen","member.low_battery":"Batterie schwach","member.unavailable":"Nicht verfügbar","mode.auto":"Automatik","mode.cool":"Kühlen","mode.dry":"Trocknen","mode.fan_only":"Nur Lüfter","mode.heat":"Heizen","mode.heat_cool":"Heizen/Kühlen","mode.off":"Aus","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-Zeitplan","reset.fallback":"Zeitplan-Fallback","reset.label":"Zurücksetzen","reset.offset":"Temperatur-Offset","reset.presets":"Gruppen-Presets","reset.schedule":"Haupt-Zeitplan","source.manual":"Manuell","source.mirror":"Mirror","source.schedule":"Zeitplan","source.sync":"Sync","source.window":"Fenster","status.active":"Aktiv","status.blocking_for":"seit {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} Abweichung","status.hold":"Halten {minutes} min","status.isolated":"{count} isoliert","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} mit schwacher Batterie","status.next":"Nächster {time}","status.no_deviations":"Keine Abweichungen","status.offset":"Offset {value}","status.oob":"{count} außerhalb des Bereichs","status.via_service":"Dienst","tile.fan":"Lüftermodus","tile.mode":"Modus","tile.preset":"Preset","tile.swing":"Schwenkmodus","tile.swing_horizontal":"Horizontal schwenken"},es:{"action.cooling":"Enfriando","action.drying":"Deshumidificando","action.fan":"Ventilador","action.heating":"Calentando","action.idle":"Inactivo","action.off":"Apagado","block.presence":"Ausente","block.switch":"Interruptor principal: Apagado","block.switch_release":"Interruptor principal: Control manual","block.switch_temperature":"Interruptor principal: Temperatura","block.window":"Ventana abierta","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} hasta las {time}","card.entity_not_found":"Entidad no encontrada: {entity}","card.more_info":"Más información","common.decrease":"Disminuir","common.humidity":"Humedad","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demostración","demo.room.bathroom":"Baño","demo.room.bedroom":"Dormitorio","demo.room.kitchen":"Cocina","demo.room.living_room":"Salón","demo.schedule":"Programación de demostración","demo.slot":"Franja de demostración","demo.vacation":"Vacaciones","editor.advanced_note":"Interruptor principal, desplazamiento del grupo, boost y restablecimiento requieren «Funciones avanzadas».","editor.battery":"Batería","editor.boost":"Botón de boost","editor.boost_absolute":"Temperatura absoluta","editor.boost_duration":"Duración","editor.boost_invalid":"Incompleto — la tarjeta no muestra el botón de boost.","editor.boost_relative":"Relativo al objetivo","editor.control.buttons":"Botones −/+","editor.control.slider":"Control deslizante","editor.control.toggle":"Selector de vista","editor.controls":"Controles","editor.custom_name":"Nombre personalizado","editor.demo":"Modo demo (datos sintéticos; no se necesita entidad)","editor.group_entity":"Entidad del grupo","editor.header":"Encabezado","editor.main_switch":"Interruptor principal","editor.more_info":"Botón de menú","editor.name":"Nombre","editor.offset":"Desplazamiento del grupo","editor.reset":"Botón de restablecer","editor.reset_empty":"Ninguna opción seleccionada — la tarjeta no muestra el botón de restablecer.","editor.section.badges":"Insignias","editor.section.deviations":"Desviaciones","editor.section.panel":"Panel","editor.status_cell":"Celda de estado","editor.title_placeholder":"Usar el nombre de la entidad","feature.calibration":"Calibración","feature.hold":"Mantener","feature.isolation":"Aislamiento","feature.presence":"Presencia","feature.schedule":"Programación","feature.sync":"Sync","feature.window":"Ventana","humidity.target":"Humedad objetivo","main_switch.label":"Interruptor principal","member.details":"Mostrar detalles de {name}","member.low_battery":"Batería baja","member.unavailable":"No disponible","mode.auto":"Automático","mode.cool":"Frío","mode.dry":"Seco","mode.fan_only":"Solo ventilador","mode.heat":"Calor","mode.heat_cool":"Calor/Frío","mode.off":"Apagado","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Programación de anulación","reset.fallback":"Reserva de la programación","reset.label":"Restablecer","reset.offset":"Desplazamiento de temperatura","reset.presets":"Preajustes de grupo","reset.schedule":"Programación principal","source.manual":"Manual","source.mirror":"Espejo","source.schedule":"Programación","source.sync":"Sync","source.window":"Ventana","status.active":"Activo","status.blocking_for":"desde hace {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergencia","status.hold":"Mantener {minutes} min","status.isolated":"{count} aislado","status.layer_bypass":"Anulación","status.layer_fallback":"Reserva","status.low_battery":"{count} con batería baja","status.next":"Siguiente {time}","status.no_deviations":"Sin desviaciones","status.offset":"Offset {value}","status.oob":"{count} fuera de rango","status.via_service":"Servicio","tile.fan":"Modo de ventilador","tile.mode":"Modo","tile.preset":"Preajuste","tile.swing":"Modo de oscilación","tile.swing_horizontal":"Oscilación horizontal"},fi:{"action.cooling":"Jäähdyttää","action.drying":"Kuivattaa","action.fan":"Puhallin","action.heating":"Lämmittää","action.idle":"Odottaa","action.off":"Pois","block.presence":"Poissa","block.switch":"Pääkytkin: Pois","block.switch_release":"Pääkytkin: Käsiohjaus","block.switch_temperature":"Pääkytkin: Lämpötila","block.window":"Ikkuna auki","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} klo {time} asti","card.entity_not_found":"Entiteettiä ei löytynyt: {entity}","card.more_info":"Lisätietoja","common.decrease":"Vähennä","common.humidity":"Kosteus","common.increase":"Lisää","common.temperature":"Lämpötila","demo.group":"Demoryhmä","demo.room.bathroom":"Kylpyhuone","demo.room.bedroom":"Makuuhuone","demo.room.kitchen":"Keittiö","demo.room.living_room":"Olohuone","demo.schedule":"Demoaikataulu","demo.slot":"Demojakso","demo.vacation":"Loma","editor.advanced_note":"Pääkytkin, ryhmän siirtymä, boost ja palautus vaativat ”Lisäominaisuudet”.","editor.battery":"Akku","editor.boost":"Boost-painike","editor.boost_absolute":"Absoluuttinen lämpötila","editor.boost_duration":"Kesto","editor.boost_invalid":"Puutteellinen — kortti ei näytä boost-painiketta.","editor.boost_relative":"Suhteessa tavoitteeseen","editor.control.buttons":"−/+-painikkeet","editor.control.slider":"Liukusäädin","editor.control.toggle":"Näkymän valitsin","editor.controls":"Säätimet","editor.custom_name":"Oma nimi","editor.demo":"Esittelytila (synteettinen data; entiteettiä ei tarvita)","editor.group_entity":"Ryhmän entiteetti","editor.header":"Ylätunniste","editor.main_switch":"Pääkytkin","editor.more_info":"Valikkopainike","editor.name":"Nimi","editor.offset":"Ryhmän siirtymä","editor.reset":"Palautuspainike","editor.reset_empty":"Mitään vaihtoehtoa ei ole valittu — kortti ei näytä palautuspainiketta.","editor.section.badges":"Merkit","editor.section.deviations":"Poikkeamat","editor.section.panel":"Paneeli","editor.status_cell":"Tilaruutu","editor.title_placeholder":"Käytä entiteetin nimeä","feature.calibration":"Kalibrointi","feature.hold":"Pito","feature.isolation":"Eristys","feature.presence":"Läsnäolo","feature.schedule":"Aikataulu","feature.sync":"Sync","feature.window":"Ikkuna","humidity.target":"Kosteuden tavoite","main_switch.label":"Pääkytkin","member.details":"Näytä laitteen {name} tiedot","member.low_battery":"Akku vähissä","member.unavailable":"Ei saatavilla","mode.auto":"Automaattinen","mode.cool":"Jäähdytys","mode.dry":"Kuivaus","mode.fan_only":"Vain puhallin","mode.heat":"Lämmitys","mode.heat_cool":"Lämmitys/Jäähdytys","mode.off":"Pois","offset.label":"Siirtymä","reset.boost":"Boost","reset.bypass":"Ohitusaikataulu","reset.fallback":"Aikataulun varatila","reset.label":"Palauta","reset.offset":"Lämpötilan siirtymä","reset.presets":"Ryhmän esiasetukset","reset.schedule":"Pääaikataulu","source.manual":"Manuaalinen","source.mirror":"Peilaus","source.schedule":"Aikataulu","source.sync":"Sync","source.window":"Ikkuna","status.active":"Aktiivinen","status.blocking_for":"jo {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} poikkeama","status.hold":"Pito {minutes} min","status.isolated":"{count} eristetty","status.layer_bypass":"Ohitus","status.layer_fallback":"Varatila","status.low_battery":"Akku vähissä: {count}","status.next":"Seuraava {time}","status.no_deviations":"Ei poikkeamia","status.offset":"Siirtymä {value}","status.oob":"{count} rajojen ulkopuolella","status.via_service":"Palvelu","tile.fan":"Puhallintila","tile.mode":"Tila","tile.preset":"Esiasetus","tile.swing":"Kääntötila","tile.swing_horizontal":"Vaakakääntö"},fr:{"action.cooling":"Refroidissement","action.drying":"Déshumidification","action.fan":"Ventilation","action.heating":"Chauffage","action.idle":"Inactif","action.off":"Éteint","block.presence":"Absent","block.switch":"Interrupteur principal : Éteint","block.switch_release":"Interrupteur principal : Contrôle manuel","block.switch_temperature":"Interrupteur principal : Température","block.window":"Fenêtre ouverte","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} jusqu’à {time}","card.entity_not_found":"Entité introuvable : {entity}","card.more_info":"Plus d'infos","common.decrease":"Diminuer","common.humidity":"Humidité","common.increase":"Augmenter","common.temperature":"Température","demo.group":"Groupe de démo","demo.room.bathroom":"Salle de bain","demo.room.bedroom":"Chambre","demo.room.kitchen":"Cuisine","demo.room.living_room":"Salon","demo.schedule":"Planification de démo","demo.slot":"Créneau de démo","demo.vacation":"Vacances","editor.advanced_note":"Interrupteur principal, décalage du groupe, boost et réinitialisation nécessitent « Fonctions avancées ».","editor.battery":"Batterie","editor.boost":"Bouton de boost","editor.boost_absolute":"Température absolue","editor.boost_duration":"Durée","editor.boost_invalid":"Incomplet — la carte n’affiche pas de bouton de boost.","editor.boost_relative":"Relatif à la cible","editor.control.buttons":"Boutons −/+","editor.control.slider":"Curseur","editor.control.toggle":"Bascule de vue","editor.controls":"Commandes","editor.custom_name":"Nom personnalisé","editor.demo":"Mode démo (données synthétiques ; aucune entité requise)","editor.group_entity":"Entité du groupe","editor.header":"En-tête","editor.main_switch":"Interrupteur principal","editor.more_info":"Bouton de menu","editor.name":"Nom","editor.offset":"Décalage du groupe","editor.reset":"Bouton de réinitialisation","editor.reset_empty":"Aucune option sélectionnée — la carte n’affiche pas de bouton de réinitialisation.","editor.section.badges":"Badges","editor.section.deviations":"Écarts","editor.section.panel":"Panneau","editor.status_cell":"Cellule d'état","editor.title_placeholder":"Utiliser le nom de l'entité","feature.calibration":"Calibration","feature.hold":"Maintien","feature.isolation":"Isolation","feature.presence":"Présence","feature.schedule":"Planification","feature.sync":"Sync","feature.window":"Fenêtre","humidity.target":"Humidité cible","main_switch.label":"Interrupteur principal","member.details":"Afficher les détails de {name}","member.low_battery":"Batterie faible","member.unavailable":"Indisponible","mode.auto":"Automatique","mode.cool":"Froid","mode.dry":"Sec","mode.fan_only":"Ventilation seule","mode.heat":"Chauffage","mode.heat_cool":"Chauffage/Froid","mode.off":"Éteint","offset.label":"Décalage","reset.boost":"Boost","reset.bypass":"Planification de contournement","reset.fallback":"Secours de la planification","reset.label":"Réinitialiser","reset.offset":"Décalage de température","reset.presets":"Préréglages de groupe","reset.schedule":"Planification principale","source.manual":"Manuel","source.mirror":"Miroir","source.schedule":"Planification","source.sync":"Sync","source.window":"Fenêtre","status.active":"Actif","status.blocking_for":"depuis {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} écart","status.hold":"Maintien {minutes} min","status.isolated":"{count} isolé","status.layer_bypass":"Contournement","status.layer_fallback":"Secours","status.low_battery":"{count} avec batterie faible","status.next":"Prochain {time}","status.no_deviations":"Aucun écart","status.offset":"Décalage {value}","status.oob":"{count} hors limites","status.via_service":"Service","tile.fan":"Mode ventilation","tile.mode":"Mode","tile.preset":"Préréglage","tile.swing":"Mode oscillation","tile.swing_horizontal":"Oscillation horizontale"},it:{"action.cooling":"Raffreddamento","action.drying":"Deumidificazione","action.fan":"Ventola","action.heating":"Riscaldamento","action.idle":"Inattivo","action.off":"Spento","block.presence":"Assente","block.switch":"Interruttore principale: Spento","block.switch_release":"Interruttore principale: Controllo manuale","block.switch_temperature":"Interruttore principale: Temperatura","block.window":"Finestra aperta","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} fino alle {time}","card.entity_not_found":"Entità non trovata: {entity}","card.more_info":"Altre info","common.decrease":"Diminuisci","common.humidity":"Umidità","common.increase":"Aumenta","common.temperature":"Temperatura","demo.group":"Gruppo demo","demo.room.bathroom":"Bagno","demo.room.bedroom":"Camera da letto","demo.room.kitchen":"Cucina","demo.room.living_room":"Soggiorno","demo.schedule":"Pianificazione demo","demo.slot":"Fascia demo","demo.vacation":"Vacanza","editor.advanced_note":"Interruttore principale, offset del gruppo, boost e ripristino richiedono «Funzioni avanzate».","editor.battery":"Batteria","editor.boost":"Pulsante boost","editor.boost_absolute":"Temperatura assoluta","editor.boost_duration":"Durata","editor.boost_invalid":"Incompleto — la scheda non mostra il pulsante boost.","editor.boost_relative":"Relativo all’obiettivo","editor.control.buttons":"Pulsanti −/+","editor.control.slider":"Cursore","editor.control.toggle":"Selettore vista","editor.controls":"Controlli","editor.custom_name":"Nome personalizzato","editor.demo":"Modalità demo (dati sintetici; nessuna entità necessaria)","editor.group_entity":"Entità del gruppo","editor.header":"Intestazione","editor.main_switch":"Interruttore principale","editor.more_info":"Pulsante menu","editor.name":"Nome","editor.offset":"Offset del gruppo","editor.reset":"Pulsante di ripristino","editor.reset_empty":"Nessuna opzione selezionata — la scheda non mostra il pulsante di ripristino.","editor.section.badges":"Badge","editor.section.deviations":"Scostamenti","editor.section.panel":"Pannello","editor.status_cell":"Cella di stato","editor.title_placeholder":"Usa il nome dell'entità","feature.calibration":"Calibrazione","feature.hold":"Mantieni","feature.isolation":"Isolamento","feature.presence":"Presenza","feature.schedule":"Pianificazione","feature.sync":"Sync","feature.window":"Finestra","humidity.target":"Umidità target","main_switch.label":"Interruttore principale","member.details":"Mostra dettagli di {name}","member.low_battery":"Batteria scarica","member.unavailable":"Non disponibile","mode.auto":"Automatico","mode.cool":"Raffreddamento","mode.dry":"Deumidificazione","mode.fan_only":"Solo ventola","mode.heat":"Riscaldamento","mode.heat_cool":"Riscaldamento/Raffreddamento","mode.off":"Spento","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Pianificazione di bypass","reset.fallback":"Riserva della pianificazione","reset.label":"Ripristina","reset.offset":"Offset temperatura","reset.presets":"Preimpostazioni di gruppo","reset.schedule":"Pianificazione principale","source.manual":"Manuale","source.mirror":"Mirror","source.schedule":"Pianificazione","source.sync":"Sync","source.window":"Finestra","status.active":"Attivo","status.blocking_for":"da {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} scostamento","status.hold":"Mantieni {minutes} min","status.isolated":"{count} isolato","status.layer_bypass":"Bypass","status.layer_fallback":"Riserva","status.low_battery":"{count} con batteria scarica","status.next":"Prossimo {time}","status.no_deviations":"Nessuno scostamento","status.offset":"Offset {value}","status.oob":"{count} fuori intervallo","status.via_service":"Servizio","tile.fan":"Modalità ventola","tile.mode":"Modalità","tile.preset":"Preset","tile.swing":"Modalità oscillazione","tile.swing_horizontal":"Oscillazione orizzontale"},nb:{"action.cooling":"Kjøler","action.drying":"Avfukter","action.fan":"Vifte","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borte","block.switch":"Hovedbryter: Av","block.switch_release":"Hovedbryter: Manuell styring","block.switch_temperature":"Hovedbryter: Temperatur","block.window":"Vindu åpent","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} til {time}","card.entity_not_found":"Enhet ikke funnet: {entity}","card.more_info":"Mer info","common.decrease":"Reduser","common.humidity":"Luftfuktighet","common.increase":"Øk","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.room.bathroom":"Bad","demo.room.bedroom":"Soverom","demo.room.kitchen":"Kjøkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrom","demo.vacation":"Ferie","editor.advanced_note":"Hovedbryter, gruppeforskyvning, boost og tilbakestilling krever «Avanserte funksjoner».","editor.battery":"Batteri","editor.boost":"Boost-knapp","editor.boost_absolute":"Absolutt temperatur","editor.boost_duration":"Varighet","editor.boost_invalid":"Ufullstendig — kortet viser ingen boost-knapp.","editor.boost_relative":"Relativt til målet","editor.control.buttons":"−/+-knapper","editor.control.slider":"Glidebryter","editor.control.toggle":"Visningsbryter","editor.controls":"Kontroller","editor.custom_name":"Eget navn","editor.demo":"Demomodus (syntetiske data; ingen enhet nødvendig)","editor.group_entity":"Gruppeenhet","editor.header":"Topptekst","editor.main_switch":"Hovedbryter","editor.more_info":"Menyknapp","editor.name":"Navn","editor.offset":"Gruppeforskyvning","editor.reset":"Tilbakestillingsknapp","editor.reset_empty":"Ingen valg er gjort — kortet viser ingen tilbakestillingsknapp.","editor.section.badges":"Merker","editor.section.deviations":"Avvik","editor.section.panel":"Panel","editor.status_cell":"Statusfelt","editor.title_placeholder":"Bruk enhetsnavnet","feature.calibration":"Kalibrering","feature.hold":"Hold","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindu","humidity.target":"Ønsket luftfuktighet","main_switch.label":"Hovedbryter","member.details":"Vis detaljer for {name}","member.low_battery":"Lavt batteri","member.unavailable":"Utilgjengelig","mode.auto":"Automatisk","mode.cool":"Kjøling","mode.dry":"Avfukting","mode.fan_only":"Kun vifte","mode.heat":"Varme","mode.heat_cool":"Varme/Kjøling","mode.off":"Av","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Omgåelsestidsplan","reset.fallback":"Reserve for tidsplan","reset.label":"Tilbakestill","reset.offset":"Temperaturforskyvning","reset.presets":"Gruppeforhåndsinnstillinger","reset.schedule":"Hovedtidsplan","source.manual":"Manuell","source.mirror":"Speiling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindu","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} avvik","status.hold":"Hold {minutes} min","status.isolated":"{count} isolert","status.layer_bypass":"Omgåelse","status.layer_fallback":"Reserve","status.low_battery":"{count} med lavt batteri","status.next":"Neste {time}","status.no_deviations":"Ingen avvik","status.offset":"Offset {value}","status.oob":"{count} utenfor området","status.via_service":"Tjeneste","tile.fan":"Viftemodus","tile.mode":"Modus","tile.preset":"Forhåndsinnstilling","tile.swing":"Svingmodus","tile.swing_horizontal":"Horisontal sving"},nl:{"action.cooling":"Koelen","action.drying":"Ontvochtigen","action.fan":"Ventilator","action.heating":"Verwarmen","action.idle":"Inactief","action.off":"Uit","block.presence":"Afwezig","block.switch":"Hoofdschakelaar: Uit","block.switch_release":"Hoofdschakelaar: Handmatige bediening","block.switch_temperature":"Hoofdschakelaar: Temperatuur","block.window":"Raam open","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} tot {time}","card.entity_not_found":"Entiteit niet gevonden: {entity}","card.more_info":"Meer info","common.decrease":"Verlagen","common.humidity":"Luchtvochtigheid","common.increase":"Verhogen","common.temperature":"Temperatuur","demo.group":"Demogroep","demo.room.bathroom":"Badkamer","demo.room.bedroom":"Slaapkamer","demo.room.kitchen":"Keuken","demo.room.living_room":"Woonkamer","demo.schedule":"Demoschema","demo.slot":"Demoblok","demo.vacation":"Vakantie","editor.advanced_note":"Hoofdschakelaar, groepsoffset, boost en reset vereisen „Geavanceerde functies”.","editor.battery":"Batterij","editor.boost":"Boostknop","editor.boost_absolute":"Absolute temperatuur","editor.boost_duration":"Duur","editor.boost_invalid":"Onvolledig — de kaart toont geen boostknop.","editor.boost_relative":"Ten opzichte van het doel","editor.control.buttons":"−/+-knoppen","editor.control.slider":"Schuifregelaar","editor.control.toggle":"Weergaveschakelaar","editor.controls":"Bediening","editor.custom_name":"Eigen naam","editor.demo":"Demomodus (synthetische gegevens; geen entiteit nodig)","editor.group_entity":"Groepsentiteit","editor.header":"Kop","editor.main_switch":"Hoofdschakelaar","editor.more_info":"Menuknop","editor.name":"Naam","editor.offset":"Groepsoffset","editor.reset":"Resetknop","editor.reset_empty":"Geen optie gekozen — de kaart toont geen resetknop.","editor.section.badges":"Badges","editor.section.deviations":"Afwijkingen","editor.section.panel":"Paneel","editor.status_cell":"Statuscel","editor.title_placeholder":"Entiteitsnaam gebruiken","feature.calibration":"Kalibratie","feature.hold":"Vasthouden","feature.isolation":"Isolatie","feature.presence":"Aanwezigheid","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Raam","humidity.target":"Gewenste luchtvochtigheid","main_switch.label":"Hoofdschakelaar","member.details":"Details van {name} tonen","member.low_battery":"Batterij bijna leeg","member.unavailable":"Niet beschikbaar","mode.auto":"Automatisch","mode.cool":"Koelen","mode.dry":"Drogen","mode.fan_only":"Alleen ventilator","mode.heat":"Verwarmen","mode.heat_cool":"Verwarmen/Koelen","mode.off":"Uit","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-schema","reset.fallback":"Schema-terugval","reset.label":"Resetten","reset.offset":"Temperatuuroffset","reset.presets":"Groepsvoorinstellingen","reset.schedule":"Hoofdschema","source.manual":"Handmatig","source.mirror":"Spiegel","source.schedule":"Schema","source.sync":"Sync","source.window":"Raam","status.active":"Actief","status.blocking_for":"al {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} afwijking","status.hold":"Vasthouden {minutes} min","status.isolated":"{count} geïsoleerd","status.layer_bypass":"Bypass","status.layer_fallback":"Terugval","status.low_battery":"{count} met bijna lege batterij","status.next":"Volgende {time}","status.no_deviations":"Geen afwijkingen","status.offset":"Offset {value}","status.oob":"{count} buiten bereik","status.via_service":"Service","tile.fan":"Ventilatormodus","tile.mode":"Modus","tile.preset":"Voorinstelling","tile.swing":"Zwenkmodus","tile.swing_horizontal":"Horizontaal zwenken"},pl:{"action.cooling":"Chłodzenie","action.drying":"Osuszanie","action.fan":"Wentylator","action.heating":"Ogrzewanie","action.idle":"Bezczynny","action.off":"Wyłączony","block.presence":"Nieobecny","block.switch":"Wyłącznik główny: Wyłączony","block.switch_release":"Wyłącznik główny: Sterowanie ręczne","block.switch_temperature":"Wyłącznik główny: Temperatura","block.window":"Okno otwarte","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} do {time}","card.entity_not_found":"Nie znaleziono encji: {entity}","card.more_info":"Więcej informacji","common.decrease":"Zmniejsz","common.humidity":"Wilgotność","common.increase":"Zwiększ","common.temperature":"Temperatura","demo.group":"Grupa demonstracyjna","demo.room.bathroom":"Łazienka","demo.room.bedroom":"Sypialnia","demo.room.kitchen":"Kuchnia","demo.room.living_room":"Salon","demo.schedule":"Harmonogram demonstracyjny","demo.slot":"Przedział demonstracyjny","demo.vacation":"Urlop","editor.advanced_note":"Wyłącznik główny, przesunięcie grupy, boost i resetowanie wymagają „Funkcje zaawansowane”.","editor.battery":"Bateria","editor.boost":"Przycisk boostu","editor.boost_absolute":"Temperatura bezwzględna","editor.boost_duration":"Czas trwania","editor.boost_invalid":"Niekompletne — karta nie pokazuje przycisku boostu.","editor.boost_relative":"Względem celu","editor.control.buttons":"Przyciski −/+","editor.control.slider":"Suwak","editor.control.toggle":"Przełącznik widoku","editor.controls":"Elementy sterujące","editor.custom_name":"Własna nazwa","editor.demo":"Tryb demo (dane syntetyczne; encja nie jest potrzebna)","editor.group_entity":"Encja grupy","editor.header":"Nagłówek","editor.main_switch":"Wyłącznik główny","editor.more_info":"Przycisk menu","editor.name":"Nazwa","editor.offset":"Przesunięcie grupy","editor.reset":"Przycisk resetu","editor.reset_empty":"Nie wybrano żadnej opcji — karta nie pokazuje przycisku resetu.","editor.section.badges":"Odznaki","editor.section.deviations":"Odchylenia","editor.section.panel":"Panel","editor.status_cell":"Komórka stanu","editor.title_placeholder":"Użyj nazwy encji","feature.calibration":"Kalibracja","feature.hold":"Wstrzymanie","feature.isolation":"Izolacja","feature.presence":"Obecność","feature.schedule":"Harmonogram","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Docelowa wilgotność","main_switch.label":"Wyłącznik główny","member.details":"Pokaż szczegóły: {name}","member.low_battery":"Słaba bateria","member.unavailable":"Niedostępny","mode.auto":"Automatyczny","mode.cool":"Chłodzenie","mode.dry":"Osuszanie","mode.fan_only":"Tylko wentylator","mode.heat":"Ogrzewanie","mode.heat_cool":"Ogrzewanie/Chłodzenie","mode.off":"Wyłączony","offset.label":"Przesunięcie","reset.boost":"Boost","reset.bypass":"Harmonogram obejścia","reset.fallback":"Zapas harmonogramu","reset.label":"Resetuj","reset.offset":"Przesunięcie temperatury","reset.presets":"Profile grupy","reset.schedule":"Główny harmonogram","source.manual":"Ręcznie","source.mirror":"Lustro","source.schedule":"Harmonogram","source.sync":"Sync","source.window":"Okno","status.active":"Aktywny","status.blocking_for":"od {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchylenie","status.hold":"Wstrzymanie {minutes} min","status.isolated":"{count} izolowanych","status.layer_bypass":"Obejście","status.layer_fallback":"Zapas","status.low_battery":"{count} ze słabą baterią","status.next":"Następny {time}","status.no_deviations":"Brak odchyleń","status.offset":"Przesunięcie {value}","status.oob":"{count} poza zakresem","status.via_service":"Usługa","tile.fan":"Tryb wentylatora","tile.mode":"Tryb","tile.preset":"Ustawienie wstępne","tile.swing":"Tryb wahania","tile.swing_horizontal":"Wahanie poziome"},pt:{"action.cooling":"A arrefecer","action.drying":"A desumidificar","action.fan":"Ventilação","action.heating":"A aquecer","action.idle":"Inativo","action.off":"Desligado","block.presence":"Ausente","block.switch":"Interruptor principal: Desligado","block.switch_release":"Interruptor principal: Controlo manual","block.switch_temperature":"Interruptor principal: Temperatura","block.window":"Janela aberta","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} até às {time}","card.entity_not_found":"Entidade não encontrada: {entity}","card.more_info":"Mais informações","common.decrease":"Diminuir","common.humidity":"Humidade","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demonstração","demo.room.bathroom":"Casa de banho","demo.room.bedroom":"Quarto","demo.room.kitchen":"Cozinha","demo.room.living_room":"Sala de estar","demo.schedule":"Agendamento de demonstração","demo.slot":"Intervalo de demonstração","demo.vacation":"Férias","editor.advanced_note":"Interruptor principal, desvio do grupo, boost e reposição exigem «Funcionalidades avançadas».","editor.battery":"Bateria","editor.boost":"Botão de boost","editor.boost_absolute":"Temperatura absoluta","editor.boost_duration":"Duração","editor.boost_invalid":"Incompleto — o cartão não mostra o botão de boost.","editor.boost_relative":"Relativo ao alvo","editor.control.buttons":"Botões −/+","editor.control.slider":"Controlo deslizante","editor.control.toggle":"Seletor de vista","editor.controls":"Controlos","editor.custom_name":"Nome personalizado","editor.demo":"Modo demo (dados sintéticos; não é necessária uma entidade)","editor.group_entity":"Entidade do grupo","editor.header":"Cabeçalho","editor.main_switch":"Interruptor principal","editor.more_info":"Botão de menu","editor.name":"Nome","editor.offset":"Desvio do grupo","editor.reset":"Botão de repor","editor.reset_empty":"Nenhuma opção selecionada — o cartão não mostra o botão de repor.","editor.section.badges":"Emblemas","editor.section.deviations":"Desvios","editor.section.panel":"Painel","editor.status_cell":"Célula de estado","editor.title_placeholder":"Usar o nome da entidade","feature.calibration":"Calibração","feature.hold":"Manter","feature.isolation":"Isolamento","feature.presence":"Presença","feature.schedule":"Agendamento","feature.sync":"Sync","feature.window":"Janela","humidity.target":"Humidade alvo","main_switch.label":"Interruptor principal","member.details":"Mostrar detalhes de {name}","member.low_battery":"Bateria fraca","member.unavailable":"Indisponível","mode.auto":"Automático","mode.cool":"Arrefecimento","mode.dry":"Desumidificação","mode.fan_only":"Apenas ventilação","mode.heat":"Aquecimento","mode.heat_cool":"Aquecimento/Arrefecimento","mode.off":"Desligado","offset.label":"Desvio","reset.boost":"Boost","reset.bypass":"Agendamento de substituição","reset.fallback":"Reserva do agendamento","reset.label":"Repor","reset.offset":"Desvio de temperatura","reset.presets":"Predefinições de grupo","reset.schedule":"Agendamento principal","source.manual":"Manual","source.mirror":"Espelho","source.schedule":"Agendamento","source.sync":"Sync","source.window":"Janela","status.active":"Ativo","status.blocking_for":"há {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergência","status.hold":"Manter {minutes} min","status.isolated":"{count} isolado","status.layer_bypass":"Substituição","status.layer_fallback":"Reserva","status.low_battery":"{count} com bateria fraca","status.next":"Seguinte {time}","status.no_deviations":"Sem desvios","status.offset":"Desvio {value}","status.oob":"{count} fora do intervalo","status.via_service":"Serviço","tile.fan":"Modo de ventilação","tile.mode":"Modo","tile.preset":"Predefinição","tile.swing":"Modo de oscilação","tile.swing_horizontal":"Oscilação horizontal"},sk:{"action.cooling":"Chladenie","action.drying":"Odvlhčovanie","action.fan":"Ventilátor","action.heating":"Kúrenie","action.idle":"Nečinný","action.off":"Vypnuté","block.presence":"Neprítomný","block.switch":"Hlavný vypínač: Vypnuté","block.switch_release":"Hlavný vypínač: Ručné ovládanie","block.switch_temperature":"Hlavný vypínač: Teplota","block.window":"Okno otvorené","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} do {time}","card.entity_not_found":"Entita sa nenašla: {entity}","card.more_info":"Viac informácií","common.decrease":"Znížiť","common.humidity":"Vlhkosť","common.increase":"Zvýšiť","common.temperature":"Teplota","demo.group":"Demo skupina","demo.room.bathroom":"Kúpeľňa","demo.room.bedroom":"Spálňa","demo.room.kitchen":"Kuchyňa","demo.room.living_room":"Obývačka","demo.schedule":"Demo plán","demo.slot":"Demo úsek","demo.vacation":"Dovolenka","editor.advanced_note":"Hlavný vypínač, offset skupiny, boost a obnovenie vyžadujú „Pokročilé funkcie“.","editor.battery":"Batéria","editor.boost":"Tlačidlo boostu","editor.boost_absolute":"Absolútna teplota","editor.boost_duration":"Trvanie","editor.boost_invalid":"Neúplné — karta nezobrazí tlačidlo boostu.","editor.boost_relative":"Relatívne k cieľu","editor.control.buttons":"Tlačidlá −/+","editor.control.slider":"Posuvník","editor.control.toggle":"Prepínač zobrazenia","editor.controls":"Ovládacie prvky","editor.custom_name":"Vlastný názov","editor.demo":"Režim ukážky (syntetické údaje; entita nie je potrebná)","editor.group_entity":"Entita skupiny","editor.header":"Hlavička","editor.main_switch":"Hlavný vypínač","editor.more_info":"Tlačidlo ponuky","editor.name":"Názov","editor.offset":"Offset skupiny","editor.reset":"Tlačidlo obnovenia","editor.reset_empty":"Nie je vybraná žiadna možnosť — karta nezobrazí tlačidlo obnovenia.","editor.section.badges":"Odznaky","editor.section.deviations":"Odchýlky","editor.section.panel":"Panel","editor.status_cell":"Stavová bunka","editor.title_placeholder":"Použiť názov entity","feature.calibration":"Kalibrácia","feature.hold":"Podržať","feature.isolation":"Izolácia","feature.presence":"Prítomnosť","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cieľová vlhkosť","main_switch.label":"Hlavný vypínač","member.details":"Zobraziť podrobnosti: {name}","member.low_battery":"Slabá batéria","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chladenie","mode.dry":"Odvlhčovanie","mode.fan_only":"Iba ventilátor","mode.heat":"Kúrenie","mode.heat_cool":"Kúrenie/Chladenie","mode.off":"Vypnuté","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Obchádzkový plán","reset.fallback":"Náhradný plán","reset.label":"Obnoviť","reset.offset":"Teplotný offset","reset.presets":"Predvoľby skupiny","reset.schedule":"Hlavný plán","source.manual":"Ručne","source.mirror":"Zrkadlenie","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Aktívny","status.blocking_for":"už {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchýlka","status.hold":"Podržať {minutes} min","status.isolated":"{count} izolovaných","status.layer_bypass":"Obchádzka","status.layer_fallback":"Náhradný","status.low_battery":"{count} so slabou batériou","status.next":"Ďalší {time}","status.no_deviations":"Žiadne odchýlky","status.offset":"Offset {value}","status.oob":"{count} mimo rozsahu","status.via_service":"Služba","tile.fan":"Režim ventilátora","tile.mode":"Režim","tile.preset":"Predvoľba","tile.swing":"Režim natáčania","tile.swing_horizontal":"Vodorovné natáčanie"},sv:{"action.cooling":"Kyler","action.drying":"Avfuktar","action.fan":"Fläkt","action.heating":"Värmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borta","block.switch":"Huvudbrytare: Av","block.switch_release":"Huvudbrytare: Manuell styrning","block.switch_temperature":"Huvudbrytare: Temperatur","block.window":"Fönster öppet","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} till {time}","card.entity_not_found":"Entitet hittades inte: {entity}","card.more_info":"Mer info","common.decrease":"Minska","common.humidity":"Luftfuktighet","common.increase":"Öka","common.temperature":"Temperatur","demo.group":"Demogrupp","demo.room.bathroom":"Badrum","demo.room.bedroom":"Sovrum","demo.room.kitchen":"Kök","demo.room.living_room":"Vardagsrum","demo.schedule":"Demoschema","demo.slot":"Demopass","demo.vacation":"Semester","editor.advanced_note":"Huvudbrytare, gruppförskjutning, boost och återställning kräver ”Avancerade funktioner”.","editor.battery":"Batteri","editor.boost":"Boostknapp","editor.boost_absolute":"Absolut temperatur","editor.boost_duration":"Varaktighet","editor.boost_invalid":"Ofullständig — kortet visar ingen boostknapp.","editor.boost_relative":"I förhållande till målet","editor.control.buttons":"−/+-knappar","editor.control.slider":"Reglage","editor.control.toggle":"Växla vy","editor.controls":"Kontroller","editor.custom_name":"Eget namn","editor.demo":"Demoläge (syntetiska data; ingen entitet behövs)","editor.group_entity":"Gruppentitet","editor.header":"Sidhuvud","editor.main_switch":"Huvudbrytare","editor.more_info":"Menyknapp","editor.name":"Namn","editor.offset":"Gruppförskjutning","editor.reset":"Återställningsknapp","editor.reset_empty":"Inget alternativ valt — kortet visar ingen återställningsknapp.","editor.section.badges":"Märken","editor.section.deviations":"Avvikelser","editor.section.panel":"Panel","editor.status_cell":"Statusruta","editor.title_placeholder":"Använd entitetens namn","feature.calibration":"Kalibrering","feature.hold":"Håll","feature.isolation":"Isolering","feature.presence":"Närvaro","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Fönster","humidity.target":"Önskad luftfuktighet","main_switch.label":"Huvudbrytare","member.details":"Visa detaljer för {name}","member.low_battery":"Låg batterinivå","member.unavailable":"Otillgänglig","mode.auto":"Automatiskt","mode.cool":"Kyla","mode.dry":"Avfuktning","mode.fan_only":"Endast fläkt","mode.heat":"Värme","mode.heat_cool":"Värme/Kyla","mode.off":"Av","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-schema","reset.fallback":"Schemareserv","reset.label":"Återställ","reset.offset":"Temperaturförskjutning","reset.presets":"Gruppförinställningar","reset.schedule":"Huvudschema","source.manual":"Manuell","source.mirror":"Spegling","source.schedule":"Schema","source.sync":"Sync","source.window":"Fönster","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} avvikelse","status.hold":"Håll {minutes} min","status.isolated":"{count} isolerad","status.layer_bypass":"Bypass","status.layer_fallback":"Reserv","status.low_battery":"{count} med låg batterinivå","status.next":"Nästa {time}","status.no_deviations":"Inga avvikelser","status.offset":"Offset {value}","status.oob":"{count} utanför intervallet","status.via_service":"Tjänst","tile.fan":"Fläktläge","tile.mode":"Läge","tile.preset":"Förinställning","tile.swing":"Svängläge","tile.swing_horizontal":"Horisontell sväng"},tr:{"action.cooling":"Soğutuyor","action.drying":"Nem alıyor","action.fan":"Fan","action.heating":"Isıtıyor","action.idle":"Boşta","action.off":"Kapalı","block.presence":"Dışarıda","block.switch":"Ana şalter: Kapalı","block.switch_release":"Ana şalter: Manuel kontrol","block.switch_temperature":"Ana şalter: Sıcaklık","block.window":"Pencere açık","boost.duration":"{minutes} dk","boost.label":"Boost","boost.running":"{time} saatine kadar {temperature}","card.entity_not_found":"Varlık bulunamadı: {entity}","card.more_info":"Daha fazla bilgi","common.decrease":"Azalt","common.humidity":"Nem","common.increase":"Artır","common.temperature":"Sıcaklık","demo.group":"Demo grubu","demo.room.bathroom":"Banyo","demo.room.bedroom":"Yatak odası","demo.room.kitchen":"Mutfak","demo.room.living_room":"Oturma odası","demo.schedule":"Demo zamanlaması","demo.slot":"Demo zaman dilimi","demo.vacation":"Tatil","editor.advanced_note":"Ana şalter, grup ofseti, boost ve sıfırlama için “Gelişmiş Özellikler” gerekir.","editor.battery":"Pil","editor.boost":"Boost düğmesi","editor.boost_absolute":"Mutlak sıcaklık","editor.boost_duration":"Süre","editor.boost_invalid":"Eksik — kart boost düğmesi göstermez.","editor.boost_relative":"Hedefe göre","editor.control.buttons":"−/+ düğmeleri","editor.control.slider":"Kaydırıcı","editor.control.toggle":"Görünüm geçişi","editor.controls":"Kontroller","editor.custom_name":"Özel ad","editor.demo":"Demo modu (sentetik veri; varlık gerekmez)","editor.group_entity":"Grup varlığı","editor.header":"Üst bilgi","editor.main_switch":"Ana şalter","editor.more_info":"Menü düğmesi","editor.name":"Ad","editor.offset":"Grup ofseti","editor.reset":"Sıfırlama düğmesi","editor.reset_empty":"Hiçbir seçenek seçilmedi — kart sıfırlama düğmesi göstermez.","editor.section.badges":"Rozetler","editor.section.deviations":"Sapmalar","editor.section.panel":"Panel","editor.status_cell":"Durum hücresi","editor.title_placeholder":"Varlık adını kullan","feature.calibration":"Kalibrasyon","feature.hold":"Beklet","feature.isolation":"İzolasyon","feature.presence":"Varlık algılama","feature.schedule":"Zamanlama","feature.sync":"Sync","feature.window":"Pencere","humidity.target":"Hedef nem","main_switch.label":"Ana şalter","member.details":"{name} ayrıntılarını göster","member.low_battery":"Pil zayıf","member.unavailable":"Kullanılamıyor","mode.auto":"Otomatik","mode.cool":"Soğutma","mode.dry":"Nem alma","mode.fan_only":"Yalnızca fan","mode.heat":"Isıtma","mode.heat_cool":"Isıtma/Soğutma","mode.off":"Kapalı","offset.label":"Ofset","reset.boost":"Boost","reset.bypass":"Bypass zamanlaması","reset.fallback":"Zamanlama yedeği","reset.label":"Sıfırla","reset.offset":"Sıcaklık ofseti","reset.presets":"Grup ön ayarları","reset.schedule":"Ana zamanlama","source.manual":"Manuel","source.mirror":"Yansıtma","source.schedule":"Zamanlama","source.sync":"Sync","source.window":"Pencere","status.active":"Etkin","status.blocking_for":"{duration} beri","status.boost":"Boost {minutes} dk","status.divergence":"{count} sapma","status.hold":"Beklet {minutes} dk","status.isolated":"{count} izole","status.layer_bypass":"Bypass","status.layer_fallback":"Yedek","status.low_battery":"{count} cihazda pil zayıf","status.next":"Sonraki {time}","status.no_deviations":"Sapma yok","status.offset":"Ofset {value}","status.oob":"{count} aralık dışında","status.via_service":"Hizmet","tile.fan":"Fan modu","tile.mode":"Mod","tile.preset":"Ön ayar","tile.swing":"Salınım modu","tile.swing_horizontal":"Yatay salınım"},uk:{"action.cooling":"Охолодження","action.drying":"Осушення","action.fan":"Вентилятор","action.heating":"Нагрівання","action.idle":"Очікування","action.off":"Вимкнено","block.presence":"Відсутній","block.switch":"Головний вимикач: Вимкнено","block.switch_release":"Головний вимикач: Ручне керування","block.switch_temperature":"Головний вимикач: Температура","block.window":"Вікно відкрите","boost.duration":"{minutes} хв","boost.label":"Boost","boost.running":"{temperature} до {time}","card.entity_not_found":"Сутність не знайдено: {entity}","card.more_info":"Докладніше","common.decrease":"Зменшити","common.humidity":"Вологість","common.increase":"Збільшити","common.temperature":"Температура","demo.group":"Демо-група","demo.room.bathroom":"Ванна кімната","demo.room.bedroom":"Спальня","demo.room.kitchen":"Кухня","demo.room.living_room":"Вітальня","demo.schedule":"Демо-розклад","demo.slot":"Демо-інтервал","demo.vacation":"Відпустка","editor.advanced_note":"Головний вимикач, зміщення групи, boost і скидання потребують «Розширені функції».","editor.battery":"Батарея","editor.boost":"Кнопка boost","editor.boost_absolute":"Абсолютна температура","editor.boost_duration":"Тривалість","editor.boost_invalid":"Неповно — картка не показує кнопку boost.","editor.boost_relative":"Відносно цілі","editor.control.buttons":"Кнопки −/+","editor.control.slider":"Повзунок","editor.control.toggle":"Перемикач вигляду","editor.controls":"Елементи керування","editor.custom_name":"Власна назва","editor.demo":"Демо-режим (синтетичні дані; сутність не потрібна)","editor.group_entity":"Сутність групи","editor.header":"Верхня панель","editor.main_switch":"Головний вимикач","editor.more_info":"Кнопка меню","editor.name":"Назва","editor.offset":"Зміщення групи","editor.reset":"Кнопка скидання","editor.reset_empty":"Не вибрано жодного параметра — картка не показує кнопку скидання.","editor.section.badges":"Значки","editor.section.deviations":"Відхилення","editor.section.panel":"Панель","editor.status_cell":"Комірка стану","editor.title_placeholder":"Використати назву сутності","feature.calibration":"Калібрування","feature.hold":"Утримання","feature.isolation":"Ізоляція","feature.presence":"Присутність","feature.schedule":"Розклад","feature.sync":"Sync","feature.window":"Вікно","humidity.target":"Цільова вологість","main_switch.label":"Головний вимикач","member.details":"Показати деталі: {name}","member.low_battery":"Низький заряд батареї","member.unavailable":"Недоступно","mode.auto":"Автоматично","mode.cool":"Охолодження","mode.dry":"Осушення","mode.fan_only":"Лише вентилятор","mode.heat":"Нагрівання","mode.heat_cool":"Нагрівання/Охолодження","mode.off":"Вимкнено","offset.label":"Зміщення","reset.boost":"Boost","reset.bypass":"Обхідний розклад","reset.fallback":"Резерв розкладу","reset.label":"Скинути","reset.offset":"Зміщення температури","reset.presets":"Пресети групи","reset.schedule":"Головний розклад","source.manual":"Вручну","source.mirror":"Дзеркало","source.schedule":"Розклад","source.sync":"Sync","source.window":"Вікно","status.active":"Активно","status.blocking_for":"уже {duration}","status.boost":"Boost {minutes} хв","status.divergence":"{count} відхилення","status.hold":"Утримання {minutes} хв","status.isolated":"{count} ізольовано","status.layer_bypass":"Обхід","status.layer_fallback":"Резерв","status.low_battery":"{count} з низьким зарядом батареї","status.next":"Наступний {time}","status.no_deviations":"Немає відхилень","status.offset":"Зміщення {value}","status.oob":"{count} поза межами","status.via_service":"Сервіс","tile.fan":"Режим вентилятора","tile.mode":"Режим","tile.preset":"Пресет","tile.swing":"Режим коливання","tile.swing_horizontal":"Горизонтальне коливання"},zh:{"action.cooling":"制冷中","action.drying":"除湿中","action.fan":"送风","action.heating":"制热中","action.idle":"空闲","action.off":"关闭","block.presence":"离开","block.switch":"主开关：关闭","block.switch_release":"主开关：手动控制","block.switch_temperature":"主开关：温度","block.window":"窗户已打开","boost.duration":"{minutes} 分钟","boost.label":"Boost","boost.running":"{temperature}，至 {time}","card.entity_not_found":"未找到实体：{entity}","card.more_info":"更多信息","common.decrease":"降低","common.humidity":"湿度","common.increase":"升高","common.temperature":"温度","demo.group":"演示组","demo.room.bathroom":"浴室","demo.room.bedroom":"卧室","demo.room.kitchen":"厨房","demo.room.living_room":"客厅","demo.schedule":"演示计划","demo.slot":"演示时段","demo.vacation":"假期","editor.advanced_note":"主开关、组偏移、Boost 和重置需要“高级功能”。","editor.battery":"电池","editor.boost":"Boost 按钮","editor.boost_absolute":"绝对温度","editor.boost_duration":"时长","editor.boost_invalid":"不完整 — 卡片不显示 Boost 按钮。","editor.boost_relative":"相对于目标","editor.control.buttons":"−/+ 按钮","editor.control.slider":"滑块","editor.control.toggle":"视图切换","editor.controls":"控件","editor.custom_name":"自定义名称","editor.demo":"演示模式（合成数据；无需实体）","editor.group_entity":"群组实体","editor.header":"顶部栏","editor.main_switch":"主开关","editor.more_info":"菜单按钮","editor.name":"名称","editor.offset":"组偏移","editor.reset":"重置按钮","editor.reset_empty":"未选择任何选项 — 卡片不显示重置按钮。","editor.section.badges":"徽章","editor.section.deviations":"偏差","editor.section.panel":"面板","editor.status_cell":"状态区","editor.title_placeholder":"使用实体名称","feature.calibration":"校准","feature.hold":"保持","feature.isolation":"隔离","feature.presence":"人员在场","feature.schedule":"计划","feature.sync":"同步","feature.window":"窗户","humidity.target":"目标湿度","main_switch.label":"主开关","member.details":"显示 {name} 的详情","member.low_battery":"电量低","member.unavailable":"不可用","mode.auto":"自动","mode.cool":"制冷","mode.dry":"除湿","mode.fan_only":"仅送风","mode.heat":"制热","mode.heat_cool":"制热/制冷","mode.off":"关闭","offset.label":"偏移","reset.boost":"Boost","reset.bypass":"旁路计划","reset.fallback":"计划后备","reset.label":"重置","reset.offset":"温度偏移","reset.presets":"组预设","reset.schedule":"主计划","source.manual":"手动","source.mirror":"镜像","source.schedule":"计划","source.sync":"同步","source.window":"窗户","status.active":"活动中","status.blocking_for":"已 {duration}","status.boost":"Boost {minutes} 分钟","status.divergence":"{count} 处分歧","status.hold":"保持 {minutes} 分钟","status.isolated":"{count} 个已隔离","status.layer_bypass":"旁路","status.layer_fallback":"后备","status.low_battery":"{count} 个电量低","status.next":"下一个 {time}","status.no_deviations":"无偏差","status.offset":"偏移 {value}","status.oob":"{count} 个超出范围","status.via_service":"服务","tile.fan":"风速模式","tile.mode":"模式","tile.preset":"预设","tile.swing":"摆风模式","tile.swing_horizontal":"水平摆风"}},Ms=e=>(e??"en").split("-")[0].toLowerCase(),Ct=(e,t,o)=>{const s=(et[Ms(e)]??et.en)[t]??et.en[t]??t;return o?s.replace(/\{(\w+)\}/g,(a,r)=>r in o?String(o[r]):a):s},Ot=(e,t,o)=>{var a;if(!o)return"";const i=`${t}.${o}`,s=((a=e==null?void 0:e.locale)==null?void 0:a.language)??(e==null?void 0:e.language);return i in et.en?Ct(s,i):o},Io=(e,t,o)=>t?Ot(e,"action",t):Ot(e,"mode",o);function j(e){return class extends e{t(t,o){var s,a,r;const i=((a=(s=this.hass)==null?void 0:s.locale)==null?void 0:a.language)??((r=this.hass)==null?void 0:r.language);return Ct(i,t,o)}}}var Ts=Object.defineProperty,Hs=Object.getOwnPropertyDescriptor,tt=(e,t,o,i)=>{for(var s=i>1?void 0:i?Hs(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&Ts(t,o,s),s};let be=class extends j(x){constructor(){super(...arguments),this.disabled=!1}get _outlineStyle(){return this.color?se({"--cgh-btn-outline":this.color}):l}_emit(e){this.dispatchEvent(new CustomEvent("cgh-step",{detail:{direction:e},bubbles:!0,composed:!0}))}render(){return c`
      <button
        class="btn"
        style=${this._outlineStyle}
        ?disabled=${this.disabled}
        aria-label=${this.t("common.decrease")}
        @click=${()=>this._emit(-1)}
      >
        <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z" /></svg>
      </button>
      <button
        class="btn"
        style=${this._outlineStyle}
        ?disabled=${this.disabled}
        aria-label=${this.t("common.increase")}
        @click=${()=>this._emit(1)}
      >
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    `}};be.styles=$`
    :host {
      display: flex;
      gap: 24px;
      justify-content: center;
    }
    .btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      /* The tiles' quiet surface and hairline, so the controls read as one set. */
      border: 1px solid
        var(
          --cgh-btn-outline,
          color-mix(in srgb, var(--primary-text-color) 14%, transparent)
        );
      background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
      color: var(--primary-text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition:
        background-color 150ms ease,
        transform 100ms ease;
    }
    .btn:hover {
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    }
    .btn:active:not(:disabled) {
      transform: scale(0.95);
    }
    .btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
    svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
  `,tt([m({attribute:!1})],be.prototype,"hass",2),tt([m({type:Boolean})],be.prototype,"disabled",2),tt([m()],be.prototype,"color",2),be=tt([E("cgh-number-buttons")],be);const I=e=>{const t=e==null?void 0:e.locale;if(!t)return e==null?void 0:e.language;switch(t.number_format){case"comma_decimal":return["en-US","en"];case"decimal_comma":return["de","es","it"];case"space_comma":return["fr","sv","cs"];case"quote_decimal":return["de-CH"];case"system":return;default:return t.language}},Bo=(e,t,o)=>{var d,u;const i=e instanceof Date?e:new Date(e),s=(d=t==null?void 0:t.locale)==null?void 0:d.time_format,a=((u=t==null?void 0:t.locale)==null?void 0:u.language)??(t==null?void 0:t.language),r=s==="system"?void 0:a,n=s==="12"||(s==="language"||s==="system"||!s)&&new Date("January 1, 2026 22:00:00").toLocaleString(r).includes("10");try{return new Intl.DateTimeFormat(s==="system"?void 0:a,{hourCycle:n?"h12":"h23",...o}).format(i)}catch{return i.toLocaleTimeString()}},Ls=(e,t)=>{var s;const o=e<60?"minute":e<1440?"hour":"day",i=o==="minute"?e:o==="hour"?e/60:e/1440;return new Intl.NumberFormat(((s=t==null?void 0:t.locale)==null?void 0:s.language)??(t==null?void 0:t.language),{style:"unit",unit:o,unitDisplay:"short"}).format(Math.max(1,Math.floor(i)))},Ds=(e,t)=>{var n,d;if(!e)return;const o=((d=(n=t==null?void 0:t.config)==null?void 0:n.unit_system)==null?void 0:d.temperature)??"°C",i=u=>new Intl.NumberFormat(I(t),{maximumFractionDigits:1}).format(u),s=e.target_temp_low,a=e.target_temp_high;if(s!=null&&a!=null)return`${i(s)}–${i(a)} ${o}`;const r=e.temperature;return r!=null?`${i(r)} ${o}`:void 0},Et=(e,t,o=!1)=>{var a,r;const i=new Intl.NumberFormat(I(t),{minimumFractionDigits:1,maximumFractionDigits:1,signDisplay:"exceptZero"}).format(e);if(o)return`${i}°`;const s=((r=(a=t==null?void 0:t.config)==null?void 0:a.unit_system)==null?void 0:r.temperature)??"°C";return`${i} ${s}`},Ro=(e,t=Date.now())=>{if(typeof e!="string")return null;const o=new Date(e).getTime()-t;return o>0?Math.ceil(o/6e4):null},zs=e=>{const t=e==null?void 0:e.state;return t==="off"||t==="unavailable"||t==="unknown"},St=e=>{switch(e==null?void 0:e.state){case"heat":return"var(--state-climate-heat-color, #ff5722)";case"cool":return"var(--state-climate-cool-color, #2196f3)";case"heat_cool":return"var(--state-climate-heat-cool-color, var(--state-climate-heat-color, #ffb300))";case"auto":return"var(--state-climate-auto-color, #4caf50)";case"dry":return"var(--state-climate-dry-color, #ff9800)";case"fan_only":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-inactive-color, var(--disabled-color, #9e9e9e))"}},Mt=e=>{const t=e==null?void 0:e.attributes.hvac_action;if(!(!t||t==="idle"||t==="off"||zs(e)))switch(t){case"cooling":return"var(--state-climate-cool-color, #2196f3)";case"drying":return"var(--state-climate-dry-color, #ff9800)";case"fan":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-climate-heat-color, #ff5722)"}},jo=(e,t)=>{var i,s;const o=t==null?void 0:t.attributes.target_temp_step;return o||(((s=(i=e==null?void 0:e.config)==null?void 0:i.unit_system)==null?void 0:s.temperature)==="°F"?1:.5)},Tt=e=>{var t;return((t=e.toString().split(".")[1])==null?void 0:t.length)??0},No=(e,t,{digits:o,unit:i,signed:s=!1})=>{if(t==null)return c`<span class="big"><span class="int">—</span></span>`;const a=new Intl.NumberFormat(I(e),{minimumFractionDigits:o,maximumFractionDigits:o,...s?{signDisplay:"exceptZero"}:{}}).format(t),r=a.includes(".")?a.split(".")[0]:a.split(",")[0],n=a.slice(r.length);return c`
    <span class="big">
      <span class="int">${r}</span>
      <span class="addon">
        <span class="decimal">${n}</span>
        <span class="unit">${i}</span>
      </span>
    </span>
  `};var Ps="M18 16H14V18H18V20L21 17L18 14V16M11 4C8.8 4 7 5.8 7 8S8.8 12 11 12 15 10.2 15 8 13.2 4 11 4M11 14C6.6 14 3 15.8 3 18V20H12.5C12.2 19.2 12 18.4 12 17.5C12 16.3 12.3 15.2 12.9 14.1C12.3 14.1 11.7 14 11 14",Vs="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16",Is="M6 14H9L5 18L1 14H4C4 11.3 5.7 6.6 11 6.1V8.1C7.6 8.6 6 11.9 6 14M20 14C20 11.3 18.3 6.6 13 6.1V8.1C16.4 8.7 18 11.9 18 14H15L19 18L23 14H20Z",Bs="M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Rs="M16,18H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",js="M16,17H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ns="M16,15H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Us="M16,14H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Fs="M16,13H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ks="M16,12H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ws="M16,10H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Gs="M16,9H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Zs="M16,8H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",qs="M14 20H6V6H14M14.67 4H13V2H7V4H5.33C4.6 4 4 4.6 4 5.33V20.67C4 21.4 4.6 22 5.33 22H14.67C15.4 22 16 21.4 16 20.67V5.33C16 4.6 15.4 4 14.67 4M21 7H19V13H21V8M21 15H19V17H21V15Z",Ys="M16,20H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Js="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z",Xs="M14,4L16.29,6.29L13.41,9.17L14.83,10.59L17.71,7.71L20,10V4M10,4H4V10L6.29,7.71L11,12.41V20H13V11.59L7.71,6.29",Qs="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",ea="M12 8L15 13.2L18 10.5L17.3 14H6.7L6 10.5L9 13.2L12 8M12 4L8.5 10L3 5L5 16H19L21 5L15.5 10L12 4M19 18H5V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V18Z",ta="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",oa="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",ia="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z",sa="M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z",aa="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",ra="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",na="M3 7H6V4H8V7H11V9H8V12H6V9H3V7M13 15H21V17H13V15M16.04 3H18.35L7.96 21H5.65L16.04 3Z",la="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13",ca="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z",da="M13.13 22.19L11.5 18.36C13.07 17.78 14.54 17 15.9 16.09L13.13 22.19M5.64 12.5L1.81 10.87L7.91 8.1C7 9.46 6.22 10.93 5.64 12.5M21.61 2.39C21.61 2.39 16.66 .269 11 5.93C8.81 8.12 7.5 10.53 6.65 12.64C6.37 13.39 6.56 14.21 7.11 14.77L9.24 16.89C9.79 17.45 10.61 17.63 11.36 17.35C13.5 16.53 15.88 15.19 18.07 13C23.73 7.34 21.61 2.39 21.61 2.39M14.54 9.46C13.76 8.68 13.76 7.41 14.54 6.63S16.59 5.85 17.37 6.63C18.14 7.41 18.15 8.68 17.37 9.46C16.59 10.24 15.32 10.24 14.54 9.46M8.88 16.53L7.47 15.12L8.88 16.53M6.24 22L9.88 18.36C9.54 18.27 9.21 18.12 8.91 17.91L4.83 22H6.24M2 22H3.41L8.18 17.24L6.76 15.83L2 20.59V22M2 19.17L6.09 15.09C5.88 14.79 5.73 14.47 5.64 14.12L2 17.76V19.17Z",ua="M20.79,13.95L18.46,14.57L16.46,13.44V10.56L18.46,9.43L20.79,10.05L21.31,8.12L19.54,7.65L20,5.88L18.07,5.36L17.45,7.69L15.45,8.82L13,7.38V5.12L14.71,3.41L13.29,2L12,3.29L10.71,2L9.29,3.41L11,5.12V7.38L8.5,8.82L6.5,7.69L5.92,5.36L4,5.88L4.47,7.65L2.7,8.12L3.22,10.05L5.55,9.43L7.55,10.56V13.45L5.55,14.58L3.22,13.96L2.7,15.89L4.47,16.36L4,18.12L5.93,18.64L6.55,16.31L8.55,15.18L11,16.62V18.88L9.29,20.59L10.71,22L12,20.71L13.29,22L14.7,20.59L13,18.88V16.62L15.5,15.17L17.5,16.3L18.12,18.63L20,18.12L19.53,16.35L21.3,15.88L20.79,13.95M9.5,10.56L12,9.11L14.5,10.56V13.44L12,14.89L9.5,13.44V10.56Z",ha="M12.92 1.58L11.18 2.58L12.39 4.67L11.8 6.85L9 7.6L7.38 6L7.42 3.59L5.43 3.59L5.43 5.42L3.59 5.42L3.6 7.42L6 7.42L7.65 9.03L6.9 11.82L4.68 12.4L2.59 11.2L1.59 12.93L3.17 13.84L2.26 15.42L4 16.42L5.19 14.33L7.42 13.75L7.92 14.26L9.32 12.86L8.78 12.32L9.53 9.54L12.32 8.78L12.85 9.32L14.26 7.91L13.73 7.37L14.32 5.19L16.41 4L15.41 2.25L13.83 3.16L12.92 1.58M20.72 4L4 20.72L5.27 22L10.16 17.11C10.63 17.43 11.15 17.68 11.71 17.83C14.38 18.55 17.12 16.96 17.83 14.29C18.22 12.86 17.93 11.36 17.11 10.16L22 5.27L20.72 4M18.74 9C19.18 9.63 19.53 10.38 19.75 11.19C19.97 12 20.03 12.81 19.96 13.61L22.65 10.41L18.74 9M19.32 15.95C19 16.67 18.5 17.35 17.93 17.94C17.34 18.53 16.66 19 15.96 19.34L20.05 20.06L19.32 15.95M9 18.71L10.41 22.66L13.59 19.95C12.81 20 12 19.97 11.19 19.76C10.36 19.54 9.62 19.17 9 18.71Z",ma="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z",pa="M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",fa="M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z",ba="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22C12.4 22 12.7 22 13.1 21.9L15.4 15.3L14.8 14.7C15.5 14 16 13 16 11.9C16 11.2 15.8 10.5 15.4 9.9L17.6 7.7C18.5 9 19 10.4 19 12H20C20.3 12 20.6 12.1 20.8 12.2C20.8 12.2 20.9 12.2 20.9 12.3C21.3 12.5 21.7 12.9 21.9 13.4C22 12.9 22 12.5 22 12C22 6.5 17.5 2 12 2M14 8.6C13.4 8.2 12.7 8 12 8C9.8 8 8 9.8 8 12C8 13.1 8.4 14.1 9.2 14.8L7.1 16.9C5.8 15.7 5 13.9 5 12C5 8.1 8.1 5 12 5C13.6 5 15 5.5 16.2 6.4L14 8.6M20 14H18L14.8 23H16.7L17.4 21H20.6L21.3 23H23.2L20 14M17.8 19.7L19 16L20.2 19.7H17.8Z",ga="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z",_a="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z",va="M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z",ya="M21 20V2H3V20H1V23H23V20M19 4V11H17V4M5 4H7V11H5M5 20V13H7V20M9 20V4H15V20M17 20V13H19V20Z";const ot=pa,wa=fa,ka=ca,Le=va,$a=ta,xa=Qs,Aa=na,Ca=ia,Oa=ua,Uo=la,Fo=oa,Ea=ha,Sa=ba,Ko=_a,Wo=Is,Ht=ya,Go=Ps,Zo=da,Ma=ga,Lt=ra,qo=Vs,Ta=aa,Ha=ea,Dt=Js,zt=ma,Yo=sa,La=Xs,Jo=qs,Da={10:Rs,20:js,30:Ns,40:Us,50:Fs,60:Ks,70:Ws,80:Gs,90:Zs,100:Bs},za=e=>e<=5?Ys:Da[Math.min(100,Math.round(e/10)*10)],Xo=e=>{switch(e){case"cool":return Oa;case"dry":return Le;case"fan_only":return Fo;case"auto":return Sa;case"heat":return Ca;case"off":return Uo;case"heat_cool":return Ea;default:return ot}},Pa=1e4;class Pt{constructor(t,o=(i,s)=>i==null?void 0:i.attributes[s]){this.host=t,this.read=o,this._values={},t.addController(this)}get(t){return this._values[t]}set(t){this._values={...this._values,...t},clearTimeout(this._timer),this._timer=setTimeout(()=>this.clear(),Pa),this.host.requestUpdate()}sync(t,o){for(const i of Object.keys(this._values))((t==null?void 0:t.entity_id)!==(o==null?void 0:o.entity_id)||this.read(t,i)!==this.read(o,i))&&delete this._values[i]}clear(){clearTimeout(this._timer),this._timer=void 0,this._values={},this.host.requestUpdate()}hostDisconnected(){this.clear()}}const Qo=$`
  .tile {
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px 6px 8px;
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    border-radius: var(--ha-border-radius-lg, 16px);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      transform 100ms ease;
  }
  .tile:hover {
    background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
  }
  .tile:active:not(:disabled) {
    transform: scale(0.98);
  }
  .tile:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .chip {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    transition: background-color 150ms ease;
  }
  .chip svg {
    width: 18px;
    height: 18px;
    fill: var(--secondary-text-color);
    transition: fill 150ms ease;
  }
  .tile.active {
    --accent: var(--primary-color);
  }
  .tile.accented .chip,
  .tile.active .chip {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }
  .tile.accented .chip svg,
  .tile.active .chip svg {
    fill: var(--accent);
  }
  .tile.active {
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .tile.active:hover {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }
`,ei=$`
  .big {
    display: inline-flex;
    align-items: flex-end;
    font-size: 57px;
    line-height: 1.12;
    letter-spacing: -0.25px;
  }
  .addon {
    display: flex;
    flex-direction: column-reverse;
    padding: 4px 0;
  }
  .decimal {
    font-size: 0.42em;
    line-height: 1.33;
    min-height: 1.33em;
  }
  .unit {
    font-size: 0.33em;
    line-height: 1.2;
    white-space: nowrap;
  }
`,Vt=$`
  .dial.no-buttons {
    margin-bottom: calc(min(100%, var(--cgh-content-width, 320px)) * -0.125);
  }
`,ti=$`
  .glow {
    position: absolute;
    inset: -10%;
    border-radius: 50%;
    background: radial-gradient(
      50% 50% at 50% 50%,
      var(--cgh-action-color, transparent) 0%,
      transparent 100%
    );
    opacity: 0.15;
    pointer-events: none;
  }
`,oi=$`
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    box-sizing: border-box;
    background: var(--disabled-color, #9e9e9e);
    flex: none;
  }
  .dot.active {
    background: var(--primary-color);
    box-shadow: 0 0 6px var(--primary-color);
  }
  .dot.unavailable {
    background: transparent;
    border: 1px solid var(--disabled-color, #9e9e9e);
    opacity: 0.5;
  }
  .dot.isolated {
    outline: 1px dashed var(--divider-color, rgba(255, 255, 255, 0.24));
    outline-offset: 1px;
  }
  /* Size, not an outline/border: those already mean isolated/OOB/deviating/
     offline, and a master can be any of them. */
  .dot.master {
    width: 12px;
    height: 12px;
  }
  /* Misses the group target: the warning ring without OOB's glow. */
  .dot.deviates {
    outline: 1px solid var(--warning-color, #ff9800);
    outline-offset: 1px;
  }
  .dot.oob {
    outline: 1px solid var(--warning-color, #ff9800);
    outline-offset: 1px;
    box-shadow: 0 0 6px var(--warning-color, #ff9800);
  }
`;var Va=Object.defineProperty,Ia=Object.getOwnPropertyDescriptor,De=(e,t,o,i)=>{for(var s=i>1?void 0:i?Ia(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&Va(t,o,s),s};const Ba=1,Ra=2;let ae=class extends x{constructor(){super(...arguments),this.buttons=!0,this._bound="low",this._pending=new Pt(this)}willUpdate(e){e.has("stateObj")&&this._pending.sync(e.get("stateObj"),this.stateObj)}_target(e){var t;return this._pending.get(e)??((t=this.stateObj)==null?void 0:t.attributes[e])}get _min(){var e;return((e=this.stateObj)==null?void 0:e.attributes.min_temp)??5}get _max(){var e;return((e=this.stateObj)==null?void 0:e.attributes.max_temp)??35}get _features(){var e;return((e=this.stateObj)==null?void 0:e.attributes.supported_features)??0}get _supportsTemperature(){var e;return(this._features&Ba)!==0&&((e=this.stateObj)==null?void 0:e.attributes.temperature)!=null}get _supportsRange(){var e,t;return(this._features&Ra)!==0&&((e=this.stateObj)==null?void 0:e.attributes.target_temp_low)!=null&&((t=this.stateObj)==null?void 0:t.attributes.target_temp_high)!=null}get _step(){return jo(this.hass,this.stateObj)}get _digits(){return Tt(this._step)}get _unit(){var e,t,o,i;return((o=(t=(e=this.hass)==null?void 0:e.config)==null?void 0:t.unit_system)==null?void 0:o.temperature)??((i=this.stateObj)==null?void 0:i.attributes.unit_of_measurement)??""}get _mode(){var i,s;const e=(i=this.stateObj)==null?void 0:i.state,t=(((s=this.stateObj)==null?void 0:s.attributes.hvac_modes)??[]).filter(a=>a==="heat"||a==="cool"||a==="heat_cool"),o=t.length===1&&(e==="auto"||e==="off")?t[0]:e;return o==="heat"?"start":o==="cool"?"end":"full"}get _inactive(){var t;const e=(t=this.stateObj)==null?void 0:t.state;return e==="off"||e==="unavailable"||e==="unknown"}_big(e){return No(this.hass,e,{digits:this._digits,unit:this._unit})}_send(e){!this.hass||!this.stateObj||(this._pending.set(e),this.hass.callService("climate","set_temperature",{entity_id:this.stateObj.entity_id,...e}))}_setSingle(e){this._send({temperature:e})}_setRange(e,t){this._send({target_temp_low:e,target_temp_high:t})}_onStep(e){const t=o=>Qe(o+e.detail.direction*this._step,this._min,this._max,this._step);if(this._supportsRange){const o=this._target("target_temp_low"),i=this._target("target_temp_high");if(this._bound==="low"){const s=t(o);s!==o&&s<=i&&this._setRange(s,i)}else{const s=t(i);s!==i&&s>=o&&this._setRange(o,s)}}else if(this._supportsTemperature){const o=this._target("temperature"),i=t(o);i!==o&&this._setSingle(i)}}_renderInfo(e,t,o,i,s){var u,f,h;const a=Io(this.hass,(u=this.stateObj)==null?void 0:u.attributes.hvac_action,(f=this.stateObj)==null?void 0:f.state),r=(h=this.stateObj)==null?void 0:h.attributes.current_humidity,n=Mt(this.stateObj),d=se(n?{color:n}:{});return c`
      <div class="overlay">
        ${a?c`<div class="action" style=${d}>${a}</div>`:l}
        ${e?c`<div class="range">
                <button
                  class="bound ${this._bound==="low"?"sel":""}"
                  @click=${()=>this._bound="low"}
                >
                  ${this._big(i)}
                </button>
                <button
                  class="bound ${this._bound==="high"?"sel":""}"
                  @click=${()=>this._bound="high"}
                >
                  ${this._big(s)}
                </button>
              </div>`:c`<div class="primary">${this._big(o)}</div>`}
        ${t!=null||r!=null?c`<div class="secondary" style=${d}>
                ${t!=null?c`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${ot} />
                        </svg>
                        ${new Intl.NumberFormat(I(this.hass),{maximumFractionDigits:1}).format(t)}
                        ${this._unit}
                      </span>`:l}
                ${t!=null&&r!=null?c`<span class="sep">·</span>`:l}
                ${r!=null?c`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${Le} />
                        </svg>
                        ${new Intl.NumberFormat(I(this.hass),{maximumFractionDigits:0}).format(r)}
                        %
                      </span>`:l}
              </div>`:l}
      </div>
    `}render(){if(!this.stateObj)return l;const t=this.stateObj.attributes.current_temperature,o=this._supportsRange,i=!o&&this._supportsTemperature,s=o?this._target("target_temp_low"):void 0,a=o?this._target("target_temp_high"):void 0,r=i?this._target("temperature"):void 0;return c`
      <div
        class="wrap"
        style=${se({"--cgh-slider-color":St(this.stateObj),"--cgh-slider-low":"var(--state-climate-heat-color, #ff5722)","--cgh-slider-high":"var(--state-climate-cool-color, #2196f3)","--cgh-action-color":Mt(this.stateObj)??"transparent"})}
      >
        <div class="dial ${this.buttons?"":"no-buttons"}">
          <div class="glow"></div>
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${this._mode}
            .inactive=${this._inactive}
            .dual=${o}
            .bound=${this._bound}
            .value=${r??l}
            .low=${s??l}
            .high=${a??l}
            .current=${t??l}
            .disabled=${!i&&!o}
            @value-changed=${n=>n.detail.value!=null&&this._setSingle(n.detail.value)}
            @low-changing=${()=>this._bound="low"}
            @high-changing=${()=>this._bound="high"}
            @low-changed=${n=>{const d=n.detail.value;d!=null&&a!=null&&this._setRange(d,a)}}
            @high-changed=${n=>{const d=n.detail.value;d!=null&&s!=null&&this._setRange(s,d)}}
          ></cgh-circular-slider>

          ${this._renderInfo(o,t,r,s,a)}
          ${this.buttons&&(i||o)?c`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .color=${o&&!this._inactive?this._bound==="high"?"var(--state-climate-cool-color, #2196f3)":"var(--state-climate-heat-color, #ff5722)":void 0}
                    @cgh-step=${this._onStep}
                  ></cgh-number-buttons>
                </div>`:l}
        </div>
      </div>
    `}};ae.styles=[ei,ti,Vt,$`
    :host {
      display: block;
    }
    .wrap {
      display: block;
    }
    .dial {
      position: relative;
      width: min(100%, var(--cgh-content-width, 320px));
      aspect-ratio: 1;
      margin: 0 auto;
    }
    cgh-circular-slider {
      position: absolute;
      inset: 0;
    }
    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      pointer-events: none;
      text-align: center;
      color: var(--primary-text-color);
      font-size: 1rem;
    }
    .action {
      color: inherit;
      font-size: 1.1rem;
      font-weight: var(--ha-font-weight-medium, 500);
      text-transform: capitalize;
      min-height: 1.5em;
    }
    .primary {
      color: inherit;
    }
    .secondary {
      display: flex;
      align-items: center;
      gap: 6px;
      color: inherit;
      font-weight: var(--ha-font-weight-medium, 500);
      font-size: 1.1rem;
    }
    .reading {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .sep {
      opacity: 0.5;
    }
    .secondary svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .buttons {
      position: absolute;
      bottom: 10px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
    }
    .range {
      display: flex;
      gap: 16px;
      pointer-events: auto;
    }
    .bound {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      color: var(--primary-text-color);
      opacity: 0.5;
      cursor: pointer;
    }
    .bound.sel {
      opacity: 1;
    }
  `],De([m({attribute:!1})],ae.prototype,"hass",2),De([m({attribute:!1})],ae.prototype,"stateObj",2),De([m({type:Boolean})],ae.prototype,"buttons",2),De([M()],ae.prototype,"_bound",2),ae=De([E("cgh-climate-temperature")],ae);var ja=Object.defineProperty,Na=Object.getOwnPropertyDescriptor,it=(e,t,o,i)=>{for(var s=i>1?void 0:i?Na(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&ja(t,o,s),s};let ge=class extends j(x){constructor(){super(...arguments),this.buttons=!0,this._pending=new Pt(this)}willUpdate(e){e.has("stateObj")&&this._pending.sync(e.get("stateObj"),this.stateObj)}get _target(){var e;return this._pending.get("humidity")??((e=this.stateObj)==null?void 0:e.attributes.humidity)}get _current(){var e;return(e=this.stateObj)==null?void 0:e.attributes.current_humidity}get _min(){var e;return((e=this.stateObj)==null?void 0:e.attributes.min_humidity)??0}get _max(){var e;return((e=this.stateObj)==null?void 0:e.attributes.max_humidity)??100}get _step(){var e;return((e=this.stateObj)==null?void 0:e.attributes.target_humidity_step)??1}get _inactive(){var t;const e=(t=this.stateObj)==null?void 0:t.state;return e==="off"||e==="unavailable"||e==="unknown"}_color(){return this._inactive?"var(--state-inactive-color, var(--disabled-color, #9e9e9e))":"var(--state-humidifier-on-color, #2196f3)"}_set(e){!this.hass||!this.stateObj||(this._pending.set({humidity:e}),this.hass.callService("climate","set_humidity",{entity_id:this.stateObj.entity_id,humidity:e}))}_onStep(e){const t=this._target;if(t==null)return;const o=Qe(t+e.detail.direction*this._step,this._min,this._max,this._step);o!==t&&this._set(o)}_format(e){return new Intl.NumberFormat(I(this.hass),{maximumFractionDigits:0}).format(e)}render(){if(!this.stateObj)return l;const e=this._target,t=this._current;return c`
      <div
        class="wrap"
        style=${se({"--cgh-slider-color":this._color()})}
      >
        <div class="dial ${this.buttons?"":"no-buttons"}">
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${"start"}
            .inactive=${this._inactive}
            .value=${e??l}
            .current=${t??l}
            @value-changed=${o=>o.detail.value!=null&&this._set(o.detail.value)}
          ></cgh-circular-slider>

          <div class="overlay">
            <div class="action">${this.t("humidity.target")}</div>
            ${e!=null?c`<div class="primary">
                    <span class="int">${this._format(e)}</span
                    ><span class="unit">%</span>
                  </div>`:l}
            ${t!=null?c`<div class="secondary">
                    <svg viewBox="0 0 24 24">
                      <path d=${Le} />
                    </svg>
                    ${this._format(t)} %
                  </div>`:l}
          </div>

          ${this.buttons?c`<div class="buttons">
                <cgh-number-buttons
                  .hass=${this.hass}
                  @cgh-step=${this._onStep}
                ></cgh-number-buttons>
              </div>`:l}
        </div>
      </div>
    `}};ge.styles=[Vt,$`
    :host {
      display: block;
    }
    .wrap {
      display: block;
    }
    .dial {
      position: relative;
      width: min(100%, 320px);
      aspect-ratio: 1;
      margin: 0 auto;
    }
    cgh-circular-slider {
      position: absolute;
      inset: 0;
    }
    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      pointer-events: none;
      text-align: center;
      color: var(--primary-text-color);
      font-size: 1rem;
    }
    .action {
      color: inherit;
      font-weight: var(--ha-font-weight-medium, 500);
      min-height: 1.5em;
    }
    .primary {
      display: inline-flex;
      align-items: baseline;
      color: inherit;
    }
    .int {
      font-size: 57px;
      line-height: 1.12;
      letter-spacing: -0.25px;
    }
    .unit {
      font-size: 24px;
      margin-left: 2px;
    }
    .secondary {
      display: flex;
      align-items: center;
      gap: 4px;
      color: inherit;
      font-weight: var(--ha-font-weight-medium, 500);
      font-size: 1.1rem;
    }
    .secondary svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .buttons {
      position: absolute;
      bottom: 10px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
    }
  `],it([m({attribute:!1})],ge.prototype,"hass",2),it([m({attribute:!1})],ge.prototype,"stateObj",2),it([m({type:Boolean})],ge.prototype,"buttons",2),ge=it([E("cgh-climate-humidity")],ge);var Ua=Object.defineProperty,Fa=Object.getOwnPropertyDescriptor,ze=(e,t,o,i)=>{for(var s=i>1?void 0:i?Fa(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&Ua(t,o,s),s};const Ka=-5,Wa=5,Ga=.5;let re=class extends j(x){constructor(){super(...arguments),this.buttons=!0,this._pending=new Pt(this,e=>e==null?void 0:e.state)}willUpdate(e){e.has("offsetObj")&&this._pending.sync(e.get("offsetObj"),this.offsetObj)}get _target(){var t;const e=Number((t=this.offsetObj)==null?void 0:t.state);if(Number.isFinite(e))return this._pending.get("value")??e}_attr(e,t){var i;const o=(i=this.offsetObj)==null?void 0:i.attributes[e];return typeof o=="number"?o:t}get _min(){return this._attr("min",Ka)}get _max(){return this._attr("max",Wa)}get _step(){return this._attr("step",Ga)}get _digits(){return Tt(this._step)}get _temperatureUnit(){var e,t,o,i;return((o=(t=(e=this.hass)==null?void 0:e.config)==null?void 0:t.unit_system)==null?void 0:o.temperature)??((i=this.stateObj)==null?void 0:i.attributes.unit_of_measurement)??""}get _unit(){var e,t,o,i;return((e=this.offsetObj)==null?void 0:e.attributes.unit_of_measurement)??((i=(o=(t=this.hass)==null?void 0:t.config)==null?void 0:o.unit_system)==null?void 0:i.temperature)??"°C"}_set(e){!this.hass||!this.offsetObj||this._target==null||(this._pending.set({value:e}),this.hass.callService("number","set_value",{entity_id:this.offsetObj.entity_id,value:e}))}_onStep(e){const t=this._target;if(t==null)return;const o=Qe(t+e.detail.direction*this._step,this._min,this._max,this._step);o!==t&&this._set(o)}_renderTarget(){var d;const e=(d=this.stateObj)==null?void 0:d.attributes,t=e==null?void 0:e.temperature,o=e==null?void 0:e.target_temp_low,i=e==null?void 0:e.target_temp_high,s=Tt(jo(this.hass,this.stateObj)),a=u=>new Intl.NumberFormat(I(this.hass),{minimumFractionDigits:s,maximumFractionDigits:s}).format(u),r=this._temperatureUnit;let n;return t!=null?n=`${a(t)} ${r}`:o!=null&&i!=null&&(n=`${a(o)}–${a(i)} ${r}`),n===void 0?l:c`<div class="target">
      <svg viewBox="0 0 24 24"><path d=${wa} /></svg>
      ${n}
    </div>`}_renderReadings(e){var i,s;const t=(i=this.stateObj)==null?void 0:i.attributes.current_temperature,o=(s=this.stateObj)==null?void 0:s.attributes.current_humidity;return t==null&&o==null?l:c`<div class="secondary" style=${se(e?{color:e}:{})}>
      ${t!=null?c`<span class="reading">
              <svg viewBox="0 0 24 24"><path d=${ot} /></svg>
              ${new Intl.NumberFormat(I(this.hass),{maximumFractionDigits:1}).format(t)}
              ${this._temperatureUnit}
            </span>`:l}
      ${t!=null&&o!=null?c`<span class="sep">·</span>`:l}
      ${o!=null?c`<span class="reading">
              <svg viewBox="0 0 24 24"><path d=${Le} /></svg>
              ${new Intl.NumberFormat(I(this.hass),{maximumFractionDigits:0}).format(o)}
              %
            </span>`:l}
    </div>`}render(){if(!this.stateObj||!this.offsetObj)return l;const e=this._target,t=Mt(this.stateObj);return c`
      <div
        class="wrap"
        style=${se({"--cgh-slider-color":St(this.stateObj),"--cgh-action-color":t??"transparent"})}
      >
        <div class="dial ${this.buttons?"":"no-buttons"}">
          <div class="glow"></div>
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${"origin"}
            .origin=${0}
            .value=${e??l}
            .disabled=${e==null}
            @value-changed=${o=>o.detail.value!=null&&this._set(o.detail.value)}
          ></cgh-circular-slider>

          <div class="overlay">
            <div class="action" style=${se(t?{color:t}:{})}>
              ${this.t("offset.label")}
            </div>
            <div class="primary">
              ${No(this.hass,e,{digits:this._digits,unit:this._unit,signed:!0})}
            </div>
            ${this._renderTarget()}
            ${this._renderReadings(t)}
          </div>

          ${this.buttons?c`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .disabled=${e==null}
                    @cgh-step=${this._onStep}
                  ></cgh-number-buttons>
                </div>`:l}
        </div>
      </div>
    `}};re.styles=[ei,ti,Vt,$`
      :host {
        display: block;
      }
      .wrap {
        display: block;
      }
      .dial {
        position: relative;
        width: min(100%, var(--cgh-content-width, 320px));
        aspect-ratio: 1;
        margin: 0 auto;
      }
      cgh-circular-slider {
        position: absolute;
        inset: 0;
      }
      .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        pointer-events: none;
        text-align: center;
        color: var(--primary-text-color);
        font-size: 1rem;
      }
      .action {
        color: inherit;
        font-size: 1.1rem;
        font-weight: var(--ha-font-weight-medium, 500);
        min-height: 1.5em;
      }
      .primary {
        color: inherit;
      }
      .target {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--secondary-text-color);
        font-weight: var(--ha-font-weight-medium, 500);
        font-size: 1rem;
      }
      .target svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      .secondary {
        display: flex;
        align-items: center;
        gap: 6px;
        color: inherit;
        font-weight: var(--ha-font-weight-medium, 500);
        font-size: 1.1rem;
      }
      .reading {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .sep {
        opacity: 0.5;
      }
      .secondary svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      .buttons {
        position: absolute;
        bottom: 10px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
      }
    `],ze([m({attribute:!1})],re.prototype,"hass",2),ze([m({attribute:!1})],re.prototype,"stateObj",2),ze([m({attribute:!1})],re.prototype,"offsetObj",2),ze([m({type:Boolean})],re.prototype,"buttons",2),re=ze([E("cgh-climate-offset")],re);var Za=Object.defineProperty,qa=Object.getOwnPropertyDescriptor,G=(e,t,o,i)=>{for(var s=i>1?void 0:i?qa(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&Za(t,o,s),s};const Ya=4,ii={offset:{icon:Aa,label:"offset.label"},temperature:{icon:ot,label:"common.temperature"},humidity:{icon:Le,label:"common.humidity"}};let B=class extends j(x){constructor(){super(...arguments),this.controls=["slider","buttons","toggle"],this.showTemperature=!0,this.showHumidity=!0,this._view="temperature"}get _hasHumidity(){var t;return((((t=this.stateObj)==null?void 0:t.attributes.supported_features)??0)&Ya)!==0}get _views(){const e=[...this.offsetObj?["offset"]:[],...this.showTemperature?["temperature"]:[],...this.showHumidity&&this._hasHumidity?["humidity"]:[]];return e.length?e:["temperature"]}_dial(e,t){switch(e){case"offset":return c`<cgh-climate-offset
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .offsetObj=${this.offsetObj}
          .buttons=${t}
        ></cgh-climate-offset>`;case"humidity":return c`<cgh-climate-humidity
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .buttons=${t}
        ></cgh-climate-humidity>`;default:return c`<cgh-climate-temperature
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .buttons=${t}
        ></cgh-climate-temperature>`}}render(){const e=this.controls.includes("slider"),t=this.controls.includes("toggle")?this._views:["temperature"],o=e&&t.length>=2,i=t.includes("temperature")?"temperature":t[0],s=o&&t.includes(this._view)?this._view:i;return e?c`
      <div class="control">
        ${this._dial(s,this.controls.includes("buttons"))}
        ${o?c`<div class="toggle">
                ${t.map(a=>c`<button
                    class="seg ${a} ${s===a?"active":""}"
                    aria-label=${this.t(ii[a].label)}
                    @click=${()=>this._view=a}
                  >
                    <svg viewBox="0 0 24 24"><path d=${ii[a].icon} /></svg>
                  </button>`)}
              </div>`:l}
      </div>
    `:l}};B.styles=$`
    :host {
      display: block;
    }
    /* The −/+ buttons sit 10px above the dial's bottom edge: 6px more makes
       the card's 16px between blocks. */
    .control {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .toggle {
      align-self: center;
      display: flex;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      /* Smoked glass: one fixed lightness step below the card, slightly
         translucent, and a soft top shadow — the switch reads as set into the
         card on any theme. A step, not a black overlay: the same black alpha
         that is subtle on a dark card turns a light one heavy grey. The first
         declaration is the fallback for browsers without relative colours. */
      border: 1px solid color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      background: rgb(0 0 0 / 0.22);
      background: oklch(
        from var(--ha-card-background, var(--card-background-color, #fff))
          calc(l - 0.05) c h / 0.9
      );
      box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.15);
    }
    .seg {
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        background-color 150ms ease,
        color 150ms ease,
        box-shadow 150ms ease;
    }
    .seg:not(.active):hover {
      background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    }
    /* Light glass on the smoked track: a translucent tint with a brighter
       hairline, the icon at full text colour — the inactive ones are muted. */
    .seg.active {
      background: color-mix(in srgb, var(--primary-text-color) 15%, transparent);
      color: var(--primary-text-color);
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--primary-text-color) 10%, transparent),
        0 1px 3px rgb(0 0 0 / 0.2);
    }
    .seg svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
  `,G([m({attribute:!1})],B.prototype,"hass",2),G([m({attribute:!1})],B.prototype,"stateObj",2),G([m({attribute:!1})],B.prototype,"controls",2),G([m({attribute:!1})],B.prototype,"offsetObj",2),G([m({attribute:!1})],B.prototype,"showTemperature",2),G([m({attribute:!1})],B.prototype,"showHumidity",2),G([M()],B.prototype,"_view",2),B=G([E("cgh-climate-control")],B);const It=["panel","badges","deviations"],Bt=["slider","buttons","toggle"],Rt=["mode","preset","fan","swing","swing_horizontal"],jt=["boost","offset","schedule","bypass","fallback","presets"],si={boost:"reset.boost",offset:"reset.offset",schedule:"reset.schedule",bypass:"reset.bypass",fallback:"reset.fallback",presets:"reset.presets"},Nt=["boost","offset","schedule","bypass"],Ut=e=>{const t=e==null?void 0:e.status;return t===!1?null:Array.isArray(t)?It.filter(o=>t.includes(o)):[...It]},Ft=e=>{const t=e==null?void 0:e.features;return Array.isArray(t)?Rt.filter(o=>t.includes(o)):[...Rt]},ai=e=>(e==null?void 0:e.title)!==!1,ri=e=>(e==null?void 0:e.more_info)!==!1,ni=e=>(e==null?void 0:e.battery)!==!1,_e=e=>{const t=e==null?void 0:e.controls;return Array.isArray(t)?Bt.filter(o=>t.includes(o)):[...Bt]},Ja=e=>{var t;return((t=e==null?void 0:e.attributes)==null?void 0:t.effective_sync_mode)!==void 0},li=e=>(e==null?void 0:e.main_switch)===!0,ci=e=>(e==null?void 0:e.offset)===!0,di=e=>(e==null?void 0:e.temperature)!==!1,ui=e=>(e==null?void 0:e.humidity)!==!1,Xa=e=>Array.isArray(e==null?void 0:e.reset),Kt=e=>{const t=e==null?void 0:e.reset;return Array.isArray(t)?jt.filter(o=>t.includes(o)):[]},hi=30,Wt=480,Gt=e=>e==="°F",st=e=>({temperature_offset:Gt(e)?4:2,duration:hi}),mi=e=>Gt(e)?75:24,pi=e=>Gt(e)?{temperature_offset:[-36,36],temperature:[41,95]}:{temperature_offset:[-20,20],temperature:[5,35]},Zt=e=>typeof(e==null?void 0:e.boost)=="object"&&e.boost!==null&&!Array.isArray(e.boost),fi=(e,t)=>{if(!Zt(e))return null;const o=e.boost,{temperature_offset:i,temperature:s,duration:a}=o;if(!(typeof a=="number"&&Number.isInteger(a)&&a>=1&&a<=Wt))return null;const r=pi(t),n=(d,[u,f])=>typeof d=="number"&&Number.isFinite(d)&&d>=u&&d<=f;return i!==void 0&&s===void 0&&n(i,r.temperature_offset)?{temperature_offset:i,duration:a}:s!==void 0&&i===void 0&&n(s,r.temperature)?{temperature:s,duration:a}:null};var Qa=Object.defineProperty,er=Object.getOwnPropertyDescriptor,Pe=(e,t,o,i)=>{for(var s=i>1?void 0:i?er(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&Qa(t,o,s),s};let ne=class extends x{constructor(){super(...arguments),this.label="",this.description="",this.active=!1}_tap(){this.dispatchEvent(new CustomEvent("cgh-action",{bubbles:!0,composed:!0}))}render(){const e=this.description||this.label;return c`
      <button
        class="tile ${this.active?"active":""}"
        title=${e}
        aria-label=${e}
        @click=${this._tap}
      >
        ${this.icon?c`<span class="chip"
                ><svg viewBox="0 0 24 24"><path d=${this.icon} /></svg
              ></span>`:l}
        <span class="label">${this.label}</span>
      </button>
    `}};ne.styles=[Qo,$`
      :host {
        display: block;
        min-width: 0;
        font-size: var(--ha-font-size-m, 0.875rem);
      }
      .label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: var(--ha-font-weight-medium, 500);
      }
    `],Pe([m()],ne.prototype,"icon",2),Pe([m()],ne.prototype,"label",2),Pe([m()],ne.prototype,"description",2),Pe([m({type:Boolean})],ne.prototype,"active",2),ne=Pe([E("cgh-action-tile")],ne);var tr=Object.defineProperty,or=Object.getOwnPropertyDescriptor,z=(e,t,o,i)=>{for(var s=i>1?void 0:i?or(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&tr(t,o,s),s};let T=class extends x{constructor(){super(...arguments),this.label="",this.options=[],this.disabled=!1,this.reselect=!1,this.active=!1,this._open=!1,this._up=!1,this._onDocumentClick=e=>{e.composedPath().includes(this)||(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick)}get _valueLabel(){var e;return((e=this.options.find(t=>t.value===this.value))==null?void 0:e.label)??this.value??""}_toggle(){if(this.disabled)return;if(this._open){this._open=!1;return}const e=this.getBoundingClientRect(),t=Math.min(this.options.length*48+8,400),o=window.innerHeight-e.bottom;this._up=o<t&&e.top>o,this._open=!0}_select(e){this._open=!1,!(e===this.value&&!this.reselect)&&this.dispatchEvent(new CustomEvent("cgh-select",{detail:{value:e},bubbles:!0,composed:!0}))}render(){return c`
      <div class="wrap">
        <button
          class="tile ${this.active?"active":""} ${this.accent?"accented":""}"
          style=${this.accent?`--accent: ${this.accent}`:""}
          title=${`${this.label}: ${this._valueLabel}`}
          ?disabled=${this.disabled}
          @click=${this._toggle}
        >
          ${this.icon?c`<span class="chip"
                  ><svg viewBox="0 0 24 24"><path d=${this.icon} /></svg
                ></span>`:l}
          <span class="content">
            <span class="label">${this.label}</span>
            <span class="value">${this._valueLabel}</span>
          </span>
        </button>
        ${this._open?c`<div class="menu ${this._up?"up":""}" role="listbox">
                ${this.options.map(e=>c`<button
                    class="option ${e.value===this.value?"selected":""}"
                    role="option"
                    aria-selected=${e.value===this.value}
                    @click=${()=>this._select(e.value)}
                  >
                    ${e.icon?c`<svg viewBox="0 0 24 24">
                            <path d=${e.icon} />
                          </svg>`:l}
                    <span>${e.label}</span>
                  </button>`)}
              </div>`:l}
      </div>
    `}};T.styles=[Qo,$`
    :host {
      display: block;
      min-width: 0;
      font-size: var(--ha-font-size-m, 0.875rem);
    }
    .wrap {
      position: relative;
    }
    .content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      flex: 1;
      min-width: 0;
    }
    /* One line each: a long label (Horizontal swing, longer in other
       languages) would wrap and push the value out of the tile. */
    .label {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ha-font-size-s, 0.75rem);
      letter-spacing: 0.4px;
      color: var(--secondary-text-color);
    }
    .value {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      max-height: 400px;
      overflow-y: auto;
      padding: 4px;
      border: 1px solid var(--wa-color-surface-border, var(--divider-color));
      border-radius: var(--ha-border-radius-md, 12px);
      background: var(--card-background-color, #fff);
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
    }
    .menu.up {
      top: auto;
      bottom: calc(100% + 4px);
    }
    .option {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      padding: 6px 12px;
      border: none;
      border-radius: var(--ha-border-radius-sm, 8px);
      background: transparent;
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .option:hover {
      background: color-mix(
        in srgb,
        var(--disabled-color, #bdbdbd) 20%,
        transparent
      );
    }
    .option.selected {
      color: var(--primary-color);
      background: var(--ha-color-fill-primary-quiet-resting, transparent);
    }
    .option svg {
      flex: none;
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
  `],z([m()],T.prototype,"icon",2),z([m()],T.prototype,"label",2),z([m()],T.prototype,"value",2),z([m({attribute:!1})],T.prototype,"options",2),z([m({type:Boolean})],T.prototype,"disabled",2),z([m({type:Boolean})],T.prototype,"reselect",2),z([m()],T.prototype,"accent",2),z([m({type:Boolean})],T.prototype,"active",2),z([M()],T.prototype,"_open",2),z([M()],T.prototype,"_up",2),T=z([E("cgh-select-tile")],T);var ir=Object.defineProperty,sr=Object.getOwnPropertyDescriptor,ve=(e,t,o,i)=>{for(var s=i>1?void 0:i?sr(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&ir(t,o,s),s};const ar=8,rr=16,nr=32,lr=512,cr=e=>["off","unavailable","unknown"].includes(e.state)?void 0:St(e),Ve={mode:["off"],preset:["none"],fan:["auto","off"],swing:["off"]},Ie=(e,t,o)=>typeof e=="string"&&t.includes(e)&&t.some(i=>o.includes(i))&&!o.includes(e);let Z=class extends j(x){constructor(){super(...arguments),this.tiles=["mode","preset","fan","swing","swing_horizontal"],this.boost=null,this.reset=[]}_call(e,t){!this.hass||!this.stateObj||this.hass.callService("climate",e,{entity_id:this.stateObj.entity_id,...t})}get _boostActive(){var e;return!!((e=this.stateObj)!=null&&e.attributes.boost_until)}_boost(){if(!(!this.hass||!this.stateObj||!this.boost)){if(this._boostActive){this.hass.callService("climate_group_helper","reset",{entity_id:this.stateObj.entity_id,boost:!0});return}this.hass.callService("climate_group_helper","boost",{entity_id:this.stateObj.entity_id,...this.boost})}}_temperature(e){var i,s,a;const t=((a=(s=(i=this.hass)==null?void 0:i.config)==null?void 0:s.unit_system)==null?void 0:a.temperature)??"°C";return`${new Intl.NumberFormat(I(this.hass),{minimumFractionDigits:1,maximumFractionDigits:1}).format(e)} ${t}`}_boostDescription(){var s;const e=this.t("boost.label"),t=(s=this.stateObj)==null?void 0:s.attributes;if(this._boostActive){const a=t==null?void 0:t.boost_temperature;return a==null?e:`${e}: ${this.t("boost.running",{temperature:this._temperature(a),time:Bo(t.boost_until,this.hass,{hour:"2-digit",minute:"2-digit"})})}`}const o=this.boost,i=o.temperature_offset!==void 0?Et(o.temperature_offset,this.hass):this._temperature(o.temperature);return`${e}: ${i} · ${this.t("boost.duration",{minutes:o.duration})}`}_reset(){!this.hass||!this.stateObj||!this.reset.length||this.hass.callService("climate_group_helper","reset",{entity_id:this.stateObj.entity_id,...Object.fromEntries(this.reset.map(e=>[e,!0]))})}_options(e,t){const o=this.stateObj;return t.map(i=>{var s,a;return{value:i,label:((a=(s=this.hass)==null?void 0:s.formatEntityAttributeValue)==null?void 0:a.call(s,o,e,i))??i}})}render(){const e=this.stateObj,t=e==null?void 0:e.attributes;if(!e||!t)return l;const o=t.supported_features??0,i=t.hvac_modes??[],s=t.preset_modes??[],a=t.fan_modes??[],r=t.swing_modes??[],n=t.swing_horizontal_modes??[],d=[this.tiles.includes("mode")&&i.length?c`<cgh-select-tile
            .icon=${Xo(e.state)}
            .accent=${cr(e)}
            .active=${Ie(e.state,i,Ve.mode)}
            .label=${this.t("tile.mode")}
            .value=${e.state}
            .options=${i.map(u=>({value:u,label:Ot(this.hass,"mode",u),icon:Xo(u)}))}
            @cgh-select=${u=>this._call("set_hvac_mode",{hvac_mode:u.detail.value})}
          ></cgh-select-tile>`:l,this.tiles.includes("preset")&&(o&rr)!==0&&s.length?c`<cgh-select-tile
            .icon=${Ko}
            .label=${this.t("tile.preset")}
            .value=${t.preset_mode}
            .active=${Ie(t.preset_mode,s,Ve.preset)}
            .options=${this._options("preset_mode",s)}
            .reselect=${!0}
            @cgh-select=${u=>this._call("set_preset_mode",{preset_mode:u.detail.value})}
          ></cgh-select-tile>`:l,this.tiles.includes("fan")&&(o&ar)!==0&&a.length?c`<cgh-select-tile
            .icon=${Fo}
            .label=${this.t("tile.fan")}
            .value=${t.fan_mode}
            .active=${Ie(t.fan_mode,a,Ve.fan)}
            .options=${this._options("fan_mode",a)}
            @cgh-select=${u=>this._call("set_fan_mode",{fan_mode:u.detail.value})}
          ></cgh-select-tile>`:l,this.tiles.includes("swing")&&(o&nr)!==0&&r.length?c`<cgh-select-tile
            .icon=${Wo}
            .label=${this.t("tile.swing")}
            .value=${t.swing_mode}
            .active=${Ie(t.swing_mode,r,Ve.swing)}
            .options=${this._options("swing_mode",r)}
            @cgh-select=${u=>this._call("set_swing_mode",{swing_mode:u.detail.value})}
          ></cgh-select-tile>`:l,this.tiles.includes("swing_horizontal")&&(o&lr)!==0&&n.length?c`<cgh-select-tile
            .icon=${Wo}
            .label=${this.t("tile.swing_horizontal")}
            .value=${t.swing_horizontal_mode}
            .active=${Ie(t.swing_horizontal_mode,n,Ve.swing)}
            .options=${this._options("swing_horizontal_mode",n)}
            @cgh-select=${u=>this._call("set_swing_horizontal_mode",{swing_horizontal_mode:u.detail.value})}
          ></cgh-select-tile>`:l,this.boost?c`<cgh-action-tile
            class="boost"
            .icon=${Zo}
            .label=${this.t("boost.label")}
            .description=${this._boostDescription()}
            .active=${this._boostActive}
            @cgh-action=${this._boost}
          ></cgh-action-tile>`:l,this.reset.length?c`<cgh-action-tile
            class="reset"
            .icon=${ka}
            .label=${this.t("reset.label")}
            .description=${`${this.t("reset.label")}: ${this.reset.map(u=>this.t(si[u])).join(", ")}`}
            @cgh-action=${this._reset}
          ></cgh-action-tile>`:l].filter(u=>u!==l);return d.length?c`<div class="tiles">${d}</div>`:l}};Z.styles=$`
    :host {
      display: block;
    }
    .tiles {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      padding: 8px;
    }
    .tiles cgh-select-tile,
    .tiles cgh-action-tile {
      flex: 1 1 120px;
      max-width: 160px;
    }
  `,ve([m({attribute:!1})],Z.prototype,"hass",2),ve([m({attribute:!1})],Z.prototype,"stateObj",2),ve([m({attribute:!1})],Z.prototype,"tiles",2),ve([m({attribute:!1})],Z.prototype,"boost",2),ve([m({attribute:!1})],Z.prototype,"reset",2),Z=ve([E("cgh-feature-tiles")],Z);const qt=30,dr=70,bi=new WeakMap,ur=e=>{let t=bi.get(e);if(!t){t=new Map;for(const[o,i]of Object.entries(e)){if(!i.device_id)continue;const s=t.get(i.device_id);s?s.push(o):t.set(i.device_id,[o])}bi.set(e,t)}return t},Yt=e=>e.entity_id.startsWith("binary_sensor."),hr=e=>{if(Yt(e))return e.state==="on"?0:e.state==="off"?100:void 0;const t=String(e.state).trim();if(!t)return;const o=Number(t);return Number.isFinite(o)?o:void 0},gi=(e,t)=>{var a;const o=t==null?void 0:t.entities;if(!t||!o)return[];const i=ur(o),s=[];for(const r of e){const n=(a=o[r])==null?void 0:a.device_id;if(!n)continue;const d=(i.get(n)??[]).flatMap(u=>{const f=t.states[u];if(!f||f.attributes.device_class!=="battery"||!(Yt(f)||u.startsWith("sensor.")))return[];const h=hr(f);return h===void 0?[]:[{state:f,level:h}]});d.length&&s.push([r,d])}return s},mr=(e,t)=>{const o={};for(const[i,s]of gi(e,t)){const a=s.filter(n=>n.level<qt),r=a.find(n=>!Yt(n.state))??a[0];r&&(o[i]=r.state)}return o},pr=(e,t)=>{let o;for(const[i,s]of gi(e,t))for(const a of s)(!o||a.level<o.level)&&(o={member:i,...a});return o},fr=e=>e<qt?"low":e<dr?"medium":"high";class br{constructor(t,o=15e3){this.host=t,this.intervalMs=o,t.addController(this)}hostConnected(){this._timer=window.setInterval(()=>this.host.requestUpdate(),this.intervalMs)}hostDisconnected(){this._timer!==void 0&&(window.clearInterval(this._timer),this._timer=void 0)}}class _i{constructor(t,o){this.host=t,this.remaining=o,t.addController(this)}hostUpdated(){this._clear();const t=this.remaining();t>0&&(this._timer=window.setTimeout(()=>this.host.requestUpdate(),t+50))}hostDisconnected(){this._clear()}_clear(){this._timer!==void 0&&(window.clearTimeout(this._timer),this._timer=void 0)}}function gr(e){return e==="bypass"?"status.layer_bypass":e==="fallback"?"status.layer_fallback":"source.schedule"}const _r=["hvac_mode","preset_mode","fan_mode","swing_mode","swing_horizontal_mode","humidity"],vr=["temperature","target_temp_low","target_temp_high"],vi=.05,yr=3e3;function Jt(e,t=Date.now()){const o=Date.parse(String((e==null?void 0:e.last_changed)??""));return Number.isNaN(o)?0:Math.max(0,o+yr-t)}function yi(e,t,o,i,s,a=Date.now()){if(!e||(e.blocking_sources??[]).length||e.boost_until||Jt(e,a)>0)return!1;const r=e.target_state??{},n=r[o];if(n==null||i==null)return!1;if(vr.includes(o)){if((e.enabled_features??[]).includes("range_template")||r.hvac_mode==="off")return!1;const u=e.member_offsets??{},f=Number(n)+(e.group_offset??0)+(u[t]??0);return Math.abs(Number(i)-f)>vi}if(o==="humidity")return Math.abs(Number(i)-Number(n))>vi;const d=s==null?void 0:s.hvac_modes;return o==="hvac_mode"&&Array.isArray(d)&&!d.includes(n)?!1:String(i)!==String(n)}function wi(e,t,o,i){var r,n;const s=e==null?void 0:e.states[t];return(s?o==="hvac_mode"?(r=e==null?void 0:e.formatEntityState)==null?void 0:r.call(e,s,String(i)):(n=e==null?void 0:e.formatEntityAttributeValue)==null?void 0:n.call(e,s,o,i):void 0)??String(i)}const wr=["switch","window","presence","boost","hold","schedule"];function kr(e,t=wr){for(const o of t){const i=e.find(s=>s.kind===o);if(i)return i}}function ki(e,t={}){var s;const o=(e==null?void 0:e.member_divergence)??{},i=new Set;for(const[a,r]of Object.entries(o))for(const[n,d]of Object.entries(r))yi(e,n,a,d,(s=t[n])==null?void 0:s.attributes)&&i.add(n);return[...i]}function $i(e,t,o=[],i=[],s,a=[]){return e.map(r=>{var n;return{id:r,state:((n=t[r])==null?void 0:n.state)??"unavailable",isolated:o.includes(r),oob:i.includes(r),deviates:a.includes(r),master:r===s}})}function xi(e){const t=e.state==="off"?"off":e.state==="unavailable"||e.state==="unknown"?"unavailable":"active",o=[e.isolated?"isolated":"",e.oob?"oob":"",e.deviates?"deviates":"",e.master?"master":""].filter(Boolean).join(" ");return o?`${t} ${o}`:t}var $r=Object.defineProperty,xr=Object.getOwnPropertyDescriptor,N=(e,t,o,i)=>{for(var s=i>1?void 0:i?xr(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&$r(t,o,s),s};const Ar=["temperature","target_temp_low","target_temp_high"];let P=class extends j(x){constructor(){super(...arguments),this.members=[],this.isolated=[],this.oob=[],this.lowBattery={},this.navigable=!1,this._wake=new _i(this,()=>Jt(this.group))}get _divergence(){var e;return((e=this.group)==null?void 0:e.member_divergence)??{}}_deviates(e,t){var i,s;const o=this._divergence[t];return!!o&&e in o&&yi(this.group,e,t,o[e],(s=(i=this.hass)==null?void 0:i.states[e])==null?void 0:s.attributes)}_values(e){const t=this._divergence;return _r.filter(o=>e in(t[o]??{})).map(o=>({text:wi(this.hass,e,o,t[o][e]),deviates:this._deviates(e,o)}))}_name(e){var t,o;return((o=(t=this.hass)==null?void 0:t.states[e])==null?void 0:o.attributes.friendly_name)??e}_action(e){var s;const t=(s=this.hass)==null?void 0:s.states[e],o=t==null?void 0:t.attributes.hvac_action,i=o??(t==null?void 0:t.state);return!i||i==="unavailable"||i==="unknown"?this.t("member.unavailable"):Io(this.hass,o,t==null?void 0:t.state)}_openDetails(e){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0}))}_batteryText(e){var t,o;return e.entity_id.startsWith("binary_sensor.")?this.t("member.low_battery"):((o=(t=this.hass)==null?void 0:t.formatEntityState)==null?void 0:o.call(t,e,e.state))??`${e.state} %`}render(){var t,o;if(!this.members.length)return l;const e=$i(this.members,((t=this.hass)==null?void 0:t.states)??{},this.isolated,this.oob,this.master,ki(this.group,(o=this.hass)==null?void 0:o.states));return c`
      <div class="list ${this.navigable?"navigable":""}" role="list">
        ${e.map(i=>{var d,u,f,h;const s=Ds((u=(d=this.hass)==null?void 0:d.states[i.id])==null?void 0:u.attributes,this.hass),a=this._values(i.id),r=(h=(f=this.group)==null?void 0:f.member_offsets)==null?void 0:h[i.id],n=Ar.some(g=>this._deviates(i.id,g));return c`
            <div class="member" role="listitem">
              <span class="dot ${xi(i)}"></span>
              <span class="name" title=${i.id}>${this._name(i.id)}</span>
              <span class="marks">${i.master?c`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${Ha} />
                  </svg>`:l}${i.isolated?c`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${Lt} />
                  </svg>`:l}${i.oob?c`<svg class="mark oob" viewBox="0 0 24 24">
                    <path d=${qo} />
                  </svg>`:l}${i.id in this.lowBattery?c`<svg class="mark battery" viewBox="0 0 24 24">
                    <title>${this._batteryText(this.lowBattery[i.id])}</title>
                    <path d=${Jo} />
                  </svg>`:l}</span>
              <span class="values">${a.length?a.map((g,y)=>c`${y?" · ":l}<span
                          class="value ${g.deviates?"deviates":""}"
                          >${g.text}</span
                        >`):l}</span>
              <span class="action">${this._action(i.id)}</span>
              <span class="offset">${r?Et(r,this.hass,!0):l}</span>
              <span class="target ${n?"deviates":""}"
                >${s??l}</span
              >
              ${this.navigable?c`<button
                      class="open"
                      title=${i.id}
                      aria-label=${this.t("member.details",{name:this._name(i.id)})}
                      @click=${()=>this._openDetails(i.id)}
                    ></button>`:l}
            </div>
          `})}
      </div>
    `}};P.styles=[oi,$`
      :host {
        display: block;
        font-size: var(--ha-font-size-s, 0.75rem);
      }
      /* One column grid shared by all rows (subgrid), so action, offset and
         target line up however many extras a row carries:
         dot | name | marks | values | action | offset | target.
         The menu sizes itself to this content, so the name column must report
         its real width (max-content), not 0. When the menu hits its maximum
         width, disputed values wrap between entries and a name gives way
         only down to its minimum. */
      .list {
        display: grid;
        grid-template-columns: auto minmax(auto, max-content) auto auto auto auto auto;
        row-gap: 2px;
      }
      .member {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        align-items: center;
        padding: 4px 6px;
        border-radius: var(--ha-border-radius-sm, 8px);
        white-space: nowrap;
        color: var(--secondary-text-color);
        position: relative;
      }
      .navigable .member:hover,
      .navigable .member:focus-within {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
      .open {
        position: absolute;
        inset: 0;
        padding: 0;
        border: none;
        border-radius: inherit;
        background: transparent;
        cursor: pointer;
      }
      .open:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: -2px;
      }
      /* Spacing lives on filled cells, so an empty column adds none. */
      .name,
      .marks:not(:empty),
      .values:not(:empty),
      .action,
      .offset:not(:empty),
      .target:not(:empty) {
        padding-left: 8px;
      }
      .name {
        min-width: 5em;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--primary-text-color);
      }
      .values {
        white-space: normal;
      }
      .value {
        white-space: nowrap;
      }
      /* Above the details button, so the marks keep their tooltips. */
      .marks {
        display: inline-flex;
        gap: 4px;
        position: relative;
        z-index: 1;
      }
      .mark {
        width: 14px;
        height: 14px;
        fill: var(--secondary-text-color);
      }
      .mark.oob {
        fill: var(--warning-color, #ff9800);
      }
      .mark.battery {
        fill: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
      }
      .action {
        text-transform: capitalize;
      }
      .offset,
      .target {
        justify-self: end;
        font-variant-numeric: tabular-nums;
      }
      .target {
        min-width: 46px;
        text-align: right;
      }
      /* Misses the group's target. */
      .deviates {
        color: var(--warning-color, #ff9800);
      }
    `],N([m({attribute:!1})],P.prototype,"hass",2),N([m({attribute:!1})],P.prototype,"members",2),N([m({attribute:!1})],P.prototype,"isolated",2),N([m({attribute:!1})],P.prototype,"oob",2),N([m({attribute:!1})],P.prototype,"master",2),N([m({attribute:!1})],P.prototype,"lowBattery",2),N([m({attribute:!1})],P.prototype,"group",2),N([m({type:Boolean})],P.prototype,"navigable",2),P=N([E("cgh-member-list")],P);var Cr=Object.defineProperty,Or=Object.getOwnPropertyDescriptor,q=(e,t,o,i)=>{for(var s=i>1?void 0:i?Or(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&Cr(t,o,s),s};const Er=10,Sr=["window","presence","schedule","sync","isolation","calibration"],Ai={switch:{labelKey:"block.switch",icon:Uo},window:{labelKey:"block.window",icon:Ht},presence:{labelKey:"block.presence",icon:Go}},Mr=e=>e==="temperature"?"block.switch_temperature":e==="release"?"block.switch_release":"block.switch",Ci={window:{labelKey:"feature.window",icon:Ht},presence:{labelKey:"feature.presence",icon:Go},schedule:{labelKey:"feature.schedule",icon:Dt},sync:{labelKey:"feature.sync",icon:zt},isolation:{labelKey:"feature.isolation",icon:Lt},calibration:{labelKey:"feature.calibration",icon:Ko}},at={ui:{labelKey:"source.manual",icon:Yo},group:{labelKey:"source.manual",icon:Yo},sync_mode:{labelKey:"source.sync",icon:zt},adopt_only:{labelKey:"source.mirror",icon:zt},window_control:{labelKey:"source.window",icon:Ht},schedule:{labelKey:"source.schedule",icon:Dt}};let R=class extends j(x){constructor(){super(...arguments),this.sections=["panel","badges","deviations"],this.battery=!0,this.navigable=!1,this._clock=new br(this),this._wake=new _i(this,()=>{var e;return Jt((e=this.stateObj)==null?void 0:e.attributes)}),this._membersOpen=!1,this._membersUp=!1,this._onDocumentClick=e=>{if(!this._membersOpen)return;const t=this.renderRoot.querySelector(".members");t&&!e.composedPath().includes(t)&&(this._membersOpen=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick)}_closeMembers(){this._membersOpen=!1}_toggleMembers(){var t;if(this._membersOpen){this._membersOpen=!1;return}const e=(t=this.renderRoot.querySelector(".members"))==null?void 0:t.getBoundingClientRect();if(e){const o=window.innerHeight-e.bottom;this._membersUp=o<320&&e.top>o}this._membersOpen=!0}_items(){var a;const e=(a=this.stateObj)==null?void 0:a.attributes;if(!e)return[];const t=[],o=e.blocking_reason;if(o!=null&&o.source&&Ai[o.source]){const r=Ai[o.source],n=o.source==="switch"?Mr(e.main_switch_action):r.labelKey,d=o.since?Date.parse(o.since):NaN,u=Number.isNaN(d)?void 0:Math.floor((Date.now()-d)/6e4);t.push({kind:o.source,icon:r.icon,label:this.t(n),detail:u==null?void 0:this.t("status.blocking_for",{duration:Ls(u,this.hass)})})}const i=Ro(e.boost_until);i!=null&&t.push({kind:"boost",icon:Zo,label:this.t("status.boost",{minutes:i})});const s=Ro(e.schedule_hold_until);return s!=null&&t.push({kind:"hold",icon:Ma,label:this.t("status.hold",{minutes:s})}),e.active_schedule_slot_title&&t.push({kind:"schedule",icon:Dt,label:this._scheduleLabel(),...this._scheduleSource()}),t}_panel(e){var i;const t=kr(e);if(t)return t;const o=(i=this.stateObj)==null?void 0:i.attributes.last_source;if(o&&at[o])return o==="schedule"?{kind:"source",icon:at[o].icon,label:this._scheduleLabel(),...this._scheduleSource()}:{kind:"source",icon:at[o].icon,label:this.t(at[o].labelKey)}}_scheduleLabel(){var e;return this.t(gr((e=this.stateObj)==null?void 0:e.attributes.active_schedule_layer))}_scheduleSource(){var s;const e=((s=this.stateObj)==null?void 0:s.attributes)??{},t=e.active_schedule_layer==="bypass",o=t?e.active_schedule_bypass_entity:e.active_schedule_entity;if(!o)return{};const i=t?e.schedule_bypass_entity_overridden:e.schedule_entity_overridden;return{scheduleName:this._name(o),pill:i?this.t("status.via_service"):void 0}}_offset(){var i;const e=(i=this.stateObj)==null?void 0:i.attributes,t=e==null?void 0:e.group_offset;if(!(!t||((e==null?void 0:e.blocking_sources)??[]).length||e!=null&&e.boost_until))return this.t("status.offset",{value:Et(t,this.hass)})}_featureActive(e){var i;const t=((i=this.stateObj)==null?void 0:i.attributes)??{},o=t.blocking_sources??[];switch(e){case"window":return o.includes("window");case"presence":return o.includes("presence");case"schedule":return t.last_source==="schedule";case"sync":return t.last_source==="sync_mode"||t.last_source==="adopt_only";case"isolation":return(t.isolated_members??[]).length>0;default:return!1}}_featurePaused(e){var i;const t=((i=this.stateObj)==null?void 0:i.attributes)??{},o=t.config_overrides??{};switch(e){case"window":return o.window_mode==="disabled";case"presence":return o.presence_mode==="disabled";case"calibration":return o.calibration_mode==="disabled";case"sync":return t.effective_sync_mode==="disabled";case"isolation":return o.isolation_bypass==="all";default:return!1}}_scheduleOn(){var t,o,i;const e=(t=this.stateObj)==null?void 0:t.attributes.active_schedule_entity;return!!e&&((i=(o=this.hass)==null?void 0:o.states[e])==null?void 0:i.state)==="on"}_nextEvent(e){var i,s;if(!e)return;const t=(s=(i=this.hass)==null?void 0:i.states[e])==null?void 0:s.attributes.next_event;if(!t)return;const o=new Date(t);if(!isNaN(o.getTime()))return Bo(o,this.hass,{hour:"2-digit",minute:"2-digit"})}_name(e){var t,o;return((o=(t=this.hass)==null?void 0:t.states[e])==null?void 0:o.attributes.friendly_name)??e}_batteryText(e){var o,i;const t=(i=(o=this.hass)==null?void 0:o.formatEntityState)==null?void 0:i.call(o,e,e.state);return t||(e.entity_id.startsWith("binary_sensor.")?e.state==="on"?this.t("member.low_battery"):e.state:`${e.state} %`)}_names(e){return e.map(t=>this._name(t)).join(", ")}_divergenceLabel(e){var o,i;if(e==="hvac_mode")return this.t("tile.mode");const t=this.stateObj;return t&&((i=(o=this.hass)==null?void 0:o.formatEntityAttributeName)==null?void 0:i.call(o,t,e))||e}_divergenceText(e,t){return Object.entries(t).map(([o,i])=>`${this._name(o)} ${wi(this.hass,o,e,i)}`).join(", ")}render(){var $e,xe,Ne;const e=($e=this.stateObj)==null?void 0:$e.attributes;if(!e)return l;const t=this._items(),o=this._panel(t),i=this.sections.includes("panel"),s=this.sections.includes("badges"),a=this.sections.includes("deviations"),r=e.enabled_features??[],n=Sr.filter(_=>r.includes(_)),d=e.isolated_members??[],u=e.oob_members??[],f=e.member_divergence??{},h=Object.keys(f),g=e.member_entities??[],y=this.battery?mr(g,this.hass):{},b=Object.keys(y),C=this.battery?pr(g,this.hass):void 0,v=!!(d.length||u.length||h.length||b.length),we=e.master_entity_id,O=$i(g,((xe=this.hass)==null?void 0:xe.states)??{},d,u,we,ki(e,(Ne=this.hass)==null?void 0:Ne.states)),ke=O.slice(0,Er),L=O.length-ke.length,J=e.total_member_count??O.length,ao=e.active_member_count??O.filter(_=>_.state!=="off"&&_.state!=="unavailable"&&_.state!=="unknown").length,ro=e.active_schedule_slot_title,no=e.active_schedule_entity,ce=ro||(this._scheduleOn()?this.t("status.active"):void 0),V=e.active_schedule_layer==="bypass"?void 0:this._nextEvent(no),U=this._offset();return c`
      <div class="status">
        ${i?c`<div class="panel ${(o==null?void 0:o.kind)??""}">
                ${U||J?c`<div class="panel-top">
                ${C?c`<svg
                      class="battery ${fr(C.level)}"
                      viewBox="0 0 24 24"
                    >
                      <title
                        >${this._name(C.member)}: ${this._batteryText(C.state)}</title
                      >
                      <path d=${za(C.level)} />
                    </svg>`:l}
                ${U?c`<span class="offset">${U}</span>`:l}
                ${J?c`<div class="members">
                        <button
                          class="members-toggle"
                          aria-expanded=${this._membersOpen}
                          @click=${this._toggleMembers}
                        >
                          <span class="dots">
                            ${ke.map(_=>c`<span
                                  class="dot ${xi(_)}"
                                  title=${this._name(_.id)}
                                ></span>`)}
                            ${L>0?c`<span class="more">+${L}</span>`:l}
                          </span>
                          <span class="count">${ao}/${J}</span>
                        </button>
                        ${this._membersOpen?c`<div
                                class="members-menu ${this._membersUp?"up":""}"
                                @hass-more-info=${this._closeMembers}
                              >
                                <cgh-member-list
                                  .hass=${this.hass}
                                  .members=${g}
                                  .isolated=${d}
                                  .oob=${u}
                                  .lowBattery=${y}
                                  .master=${we}
                                  .group=${e}
                                  .navigable=${this.navigable}
                                ></cgh-member-list>
                              </div>`:l}
                      </div>`:l}
                      </div>`:l}
                ${o?c`<div class="panel-main">
                        <svg viewBox="0 0 24 24"><path d=${o.icon} /></svg>
                        <span
                          >${o.label}${o.pill?c` <span class="pill">${o.pill}</span>`:l}${o.scheduleName?c` <span class="schedule-name"
                                  >·&nbsp;<span class="name">${o.scheduleName}</span></span
                                >`:l}${o.detail?c` <span class="detail">· ${o.detail}</span>`:l}</span
                        >
                      </div>`:l}
                ${ce||V?c`<div class="panel-info">
                        ${ce?c`<span class="slot">${ce}</span>`:l}
                        ${V?c`<span class="next"
                              >${this.t("status.next",{time:V})}</span
                            >`:l}
                      </div>`:l}
              </div>`:l}
        ${s&&(n.length||t.some(_=>_.kind==="boost"))?c`<div class="badges">
                ${n.map(_=>c`<div
                    class="badge feature ${_} ${this._featureActive(_)?"on":this._featurePaused(_)?"paused":""}"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d=${Ci[_].icon} />
                    </svg>
                    <span>${this.t(Ci[_].labelKey)}</span>
                  </div>`)}
                ${t.filter(_=>_.kind==="boost"||_.kind==="hold").map(_=>c`<div class="badge ${_.kind} on">
                      <svg viewBox="0 0 24 24"><path d=${_.icon} /></svg>
                      <span>${this.t(_.kind==="boost"?"boost.label":"feature.hold")}</span>
                    </div>`)}
              </div>`:l}
        ${a?c`<div class="deviations ${v?"":"empty"}">
                ${d.length?c`<div class="deviation isolation">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${Lt} />
                          </svg>
                          <span
                            >${this.t("status.isolated",{count:d.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(d)}</div>
                      </div>`:l}
                ${u.length?c`<div class="deviation oob">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${qo} />
                          </svg>
                          <span
                            >${this.t("status.oob",{count:u.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(u)}</div>
                      </div>`:l}
                ${b.length?c`<div class="deviation battery">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${Jo} />
                          </svg>
                          <span
                            >${this.t("status.low_battery",{count:b.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(b)}</div>
                      </div>`:l}
                ${h.length?c`<div class="deviation divergence">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${La} />
                          </svg>
                          <span
                            >${this.t("status.divergence",{count:h.length})}</span
                          >
                        </div>
                        <div class="dev-names">
                          ${h.map(_=>`${this._divergenceLabel(_)}: ${this._divergenceText(_,f[_])}`).join(" · ")}
                        </div>
                      </div>`:l}
                ${v?l:c`<div class="deviation none">
                        ${this.t("status.no_deviations")}
                      </div>`}
              </div>`:l}
      </div>
    `}};R.styles=[oi,$`
    :host {
      display: block;
    }
    .status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 8px;
    }
    .panel {
      /* The backdrop-filter makes this a stacking context; lifting it over the
         later badge/deviation siblings lets the member dropdown paint above
         them instead of showing through. */
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      min-height: 40px;
      padding: 8px 12px;
      box-sizing: border-box;
      border-radius: var(--ha-border-radius-md, 12px);
      /* A display set into the card, like an LCD: opaque, one fixed
         lightness step below the card — as deep as the view switch, no
         shallower — with most of the card's hue taken out, a hairline border and a top
         inset shadow. The step keeps the same depth on every theme and a light
         theme's panel light; the low chroma keeps a tinted theme's display
         from taking the card's hue. The first declaration is the fallback for
         browsers without relative colours. */
      background: var(--secondary-background-color, #e5e5e5);
      background: oklch(
        from var(--ha-card-background, var(--card-background-color, #fff))
          calc(l - 0.04) calc(c * 0.4) h
      );
      backdrop-filter: blur(14px) saturate(1.3);
      -webkit-backdrop-filter: blur(14px) saturate(1.3);
      border: 1px solid
        color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      box-shadow: inset 0 1px 4px rgb(0 0 0 / 0.3);
    }
    /* Offset on the left, member strip on the right; either may be absent.
       The battery's height as a floor: the row keeps it when the battery is
       hidden or unknown, so the panel does not change height with it. */
    .panel-top {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      min-height: 16px;
    }
    /* Lying on its side: MDI only has upright battery icons. */
    .panel-top .battery {
      flex: none;
      width: 16px;
      height: 16px;
      transform: rotate(90deg);
    }
    .panel-top .battery.high {
      fill: var(--state-sensor-battery-high-color, var(--success-color, #43a047));
    }
    .panel-top .battery.medium {
      fill: var(--state-sensor-battery-medium-color, var(--warning-color, #ff9800));
    }
    .panel-top .battery.low {
      fill: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
    }
    .offset {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.95);
      color: var(--secondary-text-color);
    }
    .members {
      position: relative;
      margin-left: auto;
    }
    .members-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      font: inherit;
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.95);
      cursor: pointer;
    }
    .members-toggle:hover {
      color: var(--primary-text-color);
    }
    .dots {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .more {
      opacity: 0.7;
    }
    .members-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 20;
      /* Anchored to the small dot strip: without an explicit width the menu
         would shrink to the strip's width and squeeze every name. */
      width: max-content;
      min-width: 200px;
      max-width: min(380px, calc(100vw - 32px));
      max-height: 320px;
      overflow-y: auto;
      padding: 6px;
      border: 1px solid
        var(
          --divider-color,
          color-mix(in srgb, var(--primary-text-color) 12%, transparent)
        );
      border-radius: var(--ha-border-radius-md, 12px);
      background: var(
        --secondary-background-color,
        var(--card-background-color, #fff)
      );
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
    }
    .members-menu.up {
      top: auto;
      bottom: calc(100% + 6px);
    }
    .panel-main {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      font-size: var(--ha-font-size-l, 1.05rem);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    /* Wraps rather than truncates; the duration stays on one line of its own
       rather than splitting between the number and the unit. */
    .panel-main > span {
      min-width: 0;
      overflow-wrap: break-word;
    }
    .panel-main .detail {
      white-space: nowrap;
    }
    /* A qualifier of the layer, not a second headline: names run long and
       every group now shows one. Only the name is set small; the dot keeps
       the label's size, matching the detail's separator, and stays bound to
       the name by a no-break space. */
    .panel-main .schedule-name {
      color: var(--secondary-text-color);
      font-size: 0.95em;
      font-weight: var(--ha-font-weight-normal, 400);
    }
    .panel-main .schedule-name .name {
      font-size: 0.75em;
    }
    /* The schedule name wraps with the label; the pill moves to the next line
       as a whole. */
    .panel-main .pill {
      display: inline-block;
      white-space: nowrap;
      padding: 0 5px;
      border-radius: 999px;
      /* Outline only, like the card's other frames and rings: a side note,
         not a surface. The info colour, softened by mixing with the text
         colour: pastel on a dark theme, muted on a light one. */
      border: 1px solid
        color-mix(in srgb, var(--info-color, #2196f3) 35%, transparent);
      color: color-mix(
        in srgb,
        var(--info-color, #2196f3) 55%,
        var(--primary-text-color)
      );
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.8);
      font-weight: var(--ha-font-weight-normal, 400);
      line-height: 1.35;
      vertical-align: middle;
    }
    .panel-main svg {
      flex: none;
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .panel-info {
      display: flex;
      align-items: baseline;
      gap: 8px 12px;
      min-width: 0;
      font-size: calc(var(--ha-font-size-xs, 0.7rem) * 0.95);
      color: var(--secondary-text-color);
    }
    .panel-info span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .panel-info .next {
      margin-left: auto;
      text-align: right;
    }
    .panel.source .panel-main {
      font-weight: var(--ha-font-weight-normal, 400);
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 16px;
    }
    .badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-xs, 0.7rem);
    }
    .badge svg {
      flex: none;
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
    .badge.on.window {
      color: var(--warning-color, #ff9800);
    }
    .badge.on.presence {
      color: var(--info-color, #2196f3);
    }
    .badge.on.schedule,
    .badge.on.isolation,
    .badge.on.sync,
    .badge.on.calibration,
    .badge.on.boost,
    .badge.on.hold {
      color: var(--primary-color);
    }
    /* Active badges glow in their own colour (icon via drop-shadow). */
    .badge.on svg {
      filter: drop-shadow(0 0 4px currentColor);
    }
    /* Paused by a slot or preset: the plain badge's colour, only quieter —
       --disabled-color is a dark grey in HA's dark mode and vanished. */
    .badge.paused {
      opacity: 0.45;
    }
    .deviations {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      /* One frame around all entries. Dashed (information, not a control),
         so it needs more opacity than the solid hairlines to read alike. */
      border: 1px dashed
        color-mix(in srgb, var(--primary-text-color) 20%, transparent);
      border-radius: var(--ha-border-radius-md, 12px);
      font-size: var(--ha-font-size-s, 0.75rem);
      color: var(--secondary-text-color);
    }
    .deviations.empty {
      border: none;
      padding: 0;
    }
    .deviation {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .deviation.none {
      text-align: center;
      opacity: 0.6;
    }
    .deviation.oob {
      color: var(--warning-color, #ff9800);
    }
    .deviation.oob .dev-head svg {
      filter: drop-shadow(0 0 3px currentColor);
    }
    .deviation.battery {
      color: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
    }
    .dev-head {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dev-head svg {
      flex: none;
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    /* Wraps rather than truncates: a cut-off list hides the very members it
       is about. */
    .dev-names {
      overflow-wrap: anywhere;
    }
    `],q([m({attribute:!1})],R.prototype,"hass",2),q([m({attribute:!1})],R.prototype,"stateObj",2),q([m({attribute:!1})],R.prototype,"sections",2),q([m({attribute:!1})],R.prototype,"battery",2),q([m({attribute:!1})],R.prototype,"navigable",2),q([M()],R.prototype,"_membersOpen",2),q([M()],R.prototype,"_membersUp",2),R=q([E("cgh-status")],R);const Xt="climate.demo",Oi="schedule.demo_schedule",Ei="calendar.demo_calendar",Qt="calendar.demo_vacation",eo="switch.demo_main_switch",to="number.demo_group_offset",Si=3500,H=[{id:"climate.demo_living_room",nameKey:"demo.room.living_room"},{id:"climate.demo_bedroom",nameKey:"demo.room.bedroom",battery:"sensor.demo_bedroom_battery"},{id:"climate.demo_bathroom",nameKey:"demo.room.bathroom",battery:"sensor.demo_bathroom_battery"},{id:"climate.demo_kitchen",nameKey:"demo.room.kitchen",battery:"binary_sensor.demo_kitchen_battery_low"}],Tr=Object.fromEntries(H.flatMap(e=>{const t=`demo_device_${e.id}`;return(e.battery?[e.id,e.battery]:[e.id]).map(i=>[i,{entity_id:i,device_id:t}])})),Hr=H[0].id,Lr=H[2].id,Dr=1,zr=1,Pr=2,Vr=4,Ir=8,Br=16,Rr=32,jr=512,Mi=["heat","cool","heat_cool","auto","dry","fan_only","off"],Nr=Mi.filter(e=>e!=="off"),Ti=["none","eco","comfort","away"],oo=["low","medium","high"],Ur=["window","presence","schedule","sync","isolation","range_template","calibration","master"],Fr=12,Kr=15,Wr=16,Gr=2,Hi=25,io=e=>Math.round(e*10)/10,Zr=e=>Math.round(e*2)/2,qr=e=>e.length?e.reduce((t,o)=>t+o,0)/e.length:void 0,Y=(e,t,o)=>({entity_id:e,state:t,attributes:o}),Yr=e=>{let t=e+1831565813|0;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296},Li=(e,t,o,i,s)=>{switch(e){case"off":return"off";case"dry":return"drying";case"fan_only":return"fan";case"heat":return o!=null&&t<o?"heating":"idle";case"cool":return o!=null&&t>o?"cooling":"idle";default:{const a=i??(o!=null?o-.5:void 0),r=s??(o!=null?o+.5:void 0);return a!=null&&t<a?"heating":r!=null&&t>r?"cooling":"idle"}}},Jr=(e,t={})=>{const o={};if(e.length<2)return o;const i=Object.fromEntries(e.map(s=>[s.entity_id,s.state]));new Set(Object.values(i)).size>1&&(o.hvac_mode=i);for(const s of["temperature","target_temp_low","target_temp_high"]){const a=e.filter(n=>n.attributes[s]!=null),r=a.map(n=>n.attributes[s]-(t[n.entity_id]??0));new Set(r).size>1&&(o[s]=Object.fromEntries(a.map(n=>[n.entity_id,n.attributes[s]])))}for(const s of["fan_mode","preset_mode"]){const a=Object.fromEntries(e.filter(r=>r.attributes[s]!=null).map(r=>[r.entity_id,r.attributes[s]]));new Set(Object.values(a)).size>1&&(o[s]=a)}return o},Xr=(e=Date.now(),t)=>{const o=p=>Ct(t,p),i=Math.floor(e/Si),s=p=>Yr(Math.imul(i,2654435761)+p),a=(p,w)=>s(w)<p,r=(p,w)=>p[Math.floor(s(w)*p.length)],n=a(.6,2),d=a(.8,16),u=a(.7,15),f=Ur.filter((p,w)=>a(.5,100+w)),h=p=>f.includes(p),g=f.length>0,y=[["normal",10],["off",1],["boost",1],["hold",h("schedule")?1:0],["window_off",h("window")?1:0],["window_temperature",h("window")?1:0],["presence_off",h("presence")?1:0],["presence_offset",h("presence")?1:0],["presence_temperature",h("presence")?1:0],["presence_preset",h("presence")&&d?1:0],["switch_off",g?1:0],["switch_temperature",g?1:0],["switch_release",g?1:0]],b=y.reduce((p,[,w])=>p+w,0);let C=s(1)*b;const v=(y.find(([,p])=>(C-=p)<0)??y[0])[0],we=v==="normal"||v==="hold",O=[];v.startsWith("switch")&&O.push("switch"),v.startsWith("window")&&O.push("window"),v.startsWith("presence")&&O.push("presence"),v.startsWith("switch")&&h("window")&&a(.3,131)&&O.push("window"),(v.startsWith("switch")||v.startsWith("window"))&&h("presence")&&a(.3,132)&&O.push("presence");const ke=["switch","window","presence"].find(p=>O.includes(p)),L={};h("window")&&!O.includes("window")&&a(.2,140)&&(L.window_mode="disabled"),h("presence")&&!O.includes("presence")&&a(.2,141)&&(L.presence_mode="disabled"),h("calibration")&&a(.2,142)&&(L.calibration_mode="disabled"),h("isolation")&&a(.2,143)&&(L.isolation_bypass="all"),h("sync")&&a(.2,144)&&(L.sync_mode="disabled");const J=h("sync")?L.sync_mode==="disabled"?"disabled":r(["lock","mirror","mirror_lock","master_lock","adopt_only"],145):"disabled",ao=J==="disabled"||J==="lock"?[]:[J==="adopt_only"?"adopt_only":"sync_mode"],ro=v==="switch_temperature"||v==="window_temperature"||v==="presence_offset"||v==="presence_temperature"||v==="presence_preset",no=v==="boost"&&a(.3,3),ce=v==="off"||no?"off":ro||v==="boost"?"heat":r(Nr,4),V=ce==="heat_cool"&&n,U=Zr(18+s(5)*6),$e=V?U-1.5:void 0,xe=V?U+1.5:void 0,Ne=d?r(["none","none","eco","comfort"],6):void 0,_=u?r(oo,11):void 0;let de=ce,ue=V?void 0:U,nt=Ne;switch(v){case"switch_off":case"window_off":case"presence_off":de="off";break;case"switch_temperature":ue=Kr;break;case"boost":de="heat",ue=Hi;break;case"window_temperature":ue=Fr;break;case"presence_offset":ue=U-Gr;break;case"presence_temperature":ue=Wr;break;case"presence_preset":nt="away";break}(v==="switch_off"||ke==="window"&&v==="window_off")&&(de="off");const Vi=io(19+s(7)*5),lt=a(.12,20)?Math.floor(s(21)*H.length):-1,Ue=h("isolation")&&!L.isolation_bypass&&a(.5,22)?[0,1,2,3].filter(p=>p!==lt)[Math.floor(s(23)*3)]:-1,ct=[0,1,2,3].filter(p=>p!==lt&&p!==Ue),bn=we&&de!=="off",dt=(we||v==="switch_release")&&de!=="off",Ae=bn&&a(.15,24)?r(ct,25):-1,lo=dt&&a(.3,26)?r(ct.filter(p=>p!==Ae),27):-1,gn=dt&&a(.5,28)?r(ct.filter(p=>p!==Ae&&p!==lo),29):-1,_n=a(.5,30)?.5:-.5,Ii=ct.filter(p=>p!==Ae&&p!==lo),vn=dt&&d&&a(.4,31)?r(Ii,32):-1,yn=r(Ti.filter(p=>p!==nt&&p!=="away"),33),wn=dt&&u&&a(.4,34)?r(Ii,35):-1,kn=r(oo.filter(p=>p!==_),36),co=g&&we&&a(.3,82)?r([.5,1,1.5,-.5],84):0,Fe=g&&a(.4,85)?{[Lr]:Dr}:{},ut={},ht=[];H.forEach((p,w)=>{const X=o(p.nameKey);if(w===lt){ut[p.id]=Y(p.id,"unavailable",{friendly_name:X});return}const he=io(Vi+(s(40+w)-.5)),qi=w===Ue||w===Ae||w===lo?"off":de,Yi=co+(Fe[p.id]??0),Ji=(w===gn?_n:0)+Yi,Xi=ue!=null?ue+Ji:void 0,Qi=$e!=null?$e+Ji:void 0,es=xe!=null?xe+Yi:void 0,ts=Y(p.id,qi,{friendly_name:X,current_temperature:he,temperature:Xi,target_temp_low:Qi,target_temp_high:es,preset_mode:w===vn?yn:nt,fan_mode:w===wn?kn:_,hvac_action:Li(qi,he,Xi,Qi,es)});ut[p.id]=ts,w!==Ue&&ht.push(ts)});const Bi=ht.filter(p=>p.state!=="off").length?de:"off",mt=(p,w=!0)=>{const X=qr(ht.filter(he=>he.attributes[p]!=null).map(he=>he.attributes[p]-(w?Fe[he.entity_id]??0:0)));return X!=null?io(X):void 0},Ri=mt("current_temperature",!1)??Vi,ji=V?void 0:mt("temperature"),Ni=V?mt("target_temp_low"):void 0,Ui=V?mt("target_temp_high"):void 0,Fi=Jr(ht,Fe),$n=Object.values(ut).filter(p=>p.state!=="off"&&p.state!=="unavailable").length,uo=a(.5,50),Ki=uo?Ei:Oi,Ke=h("schedule")&&(v==="hold"||a(.6,51)),We=h("schedule")&&v!=="hold"&&a(.2,52),Wi=h("schedule")&&a(.5,53),pt=h("schedule")?We?"bypass":Ke?"main":Wi?"fallback":"none":void 0,Gi=["ui","group",...ao],ho=v==="hold"?r(Gi,60):pt&&pt!=="none"&&a(.6,61)?"schedule":r(Gi,62),xn=new Date(e-Math.round(1+s(70)*20)*6e4),An=Y(Xt,Bi,{friendly_name:o("demo.group"),min_temp:5,max_temp:35,target_temp_step:.5,current_temperature:Ri,temperature:ji,target_temp_low:Ni,target_temp_high:Ui,current_humidity:35+Math.round(s(8)*30),humidity:40+Math.round(s(9)*25),min_humidity:0,max_humidity:100,target_humidity_step:1,hvac_action:Li(Bi,Ri,ji,Ni,Ui),hvac_modes:Mi,preset_modes:Ti,preset_mode:nt,fan_modes:oo,fan_mode:_,swing_modes:["off","on"],swing_mode:r(["off","on"],12),swing_horizontal_modes:["off","on"],swing_horizontal_mode:r(["off","on"],13),supported_features:zr|(n?Pr:0)|(a(.6,14)?Vr:0)|(u?Ir:0)|(d?Br:0)|(a(.5,17)?Rr:0)|(a(.4,18)?jr:0),active_member_count:$n,total_member_count:H.length,member_entities:H.map(p=>p.id),enabled_features:f,blocking_sources:O,blocking_reason:ke?{source:ke,since:xn.toISOString()}:void 0,isolated_members:Ue>=0?[H[Ue].id]:[],oob_members:Ae>=0?[H[Ae].id]:[],member_divergence:Fi,config_overrides:Object.keys(L).length?L:void 0,effective_sync_mode:g?J:void 0,main_switch_entity_id:g?eo:void 0,offset_entity_id:g?to:void 0,main_switch_action:g?v==="switch_temperature"?"temperature":v==="switch_release"?"release":"off":void 0,assumed_state:Object.keys(Fi).length>0,last_source:ho,last_entity:ho==="sync_mode"||ho==="adopt_only"?r(H,63).id:void 0,last_changed:new Date(e-(1+Math.round(s(64)*9))*6e4).toISOString(),active_schedule_entity:h("schedule")?Ki:void 0,schedule_entity_overridden:h("schedule")&&a(.6,54)?!0:void 0,active_schedule_bypass_entity:h("schedule")?Qt:void 0,schedule_bypass_entity_overridden:We&&a(.5,55)?!0:void 0,active_schedule_layer:pt,active_schedule_slot_title:We?o("demo.vacation"):Ke&&uo?o("demo.slot"):void 0,schedule_fallback_payload:Wi?{temperature:17}:void 0,schedule_fallback_payload_active:pt==="fallback"?!0:void 0,boost_temperature:v==="boost"?Hi:void 0,boost_until:v==="boost"?new Date(e+(1+s(80)*15)*6e4).toISOString():void 0,schedule_hold_until:v==="hold"?new Date(e+(5+s(81)*55)*6e4).toISOString():void 0,group_offset:co,target_state:{hvac_mode:ce,temperature:V?void 0:U,target_temp_low:$e,target_temp_high:xe,preset_mode:Ne,fan_mode:_},member_offsets:Object.keys(Fe).length?Fe:void 0,master_entity_id:h("master")?Hr:void 0,master_fallback_active:h("master")&&lt===0,presence_fallback:h("presence")&&a(.2,83)?!0:void 0}),Cn=uo?Y(Ei,Ke?"on":"off",{friendly_name:o("demo.schedule"),message:Ke?o("demo.slot"):void 0}):Y(Oi,Ke?"on":"off",{friendly_name:o("demo.schedule"),next_event:new Date(e+(1+s(90)*90)*6e4).toISOString()}),On=Y(Qt,We?"on":"off",{friendly_name:o("demo.vacation"),message:We?o("demo.vacation"):void 0}),En=H.filter(p=>p.battery),Sn=a(.3,150)?r(En,151).id:void 0,Zi={};H.forEach((p,w)=>{if(!p.battery)return;const X=p.id===Sn;Zi[p.battery]=p.battery.startsWith("binary_sensor.")?Y(p.battery,X?"on":"off",{device_class:"battery"}):Y(p.battery,String(X?5+Math.round(s(152)*(qt-10)):40+Math.round(s(153+w)*60)),{device_class:"battery",unit_of_measurement:"%"})});const Mn={entity_id:eo,state:O.includes("switch")?"off":"on",attributes:{}},Tn={entity_id:to,state:String(co),attributes:{min:-5,max:5,step:.5}};return{[Xt]:An,...g?{[eo]:Mn,[to]:Tn}:{},[Ki]:Cn,...h("schedule")?{[Qt]:On}:{},...ut,...Zi}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Qr=e=>e.strings===void 0,en={},tn=(e,t=en)=>e._$AH=t;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Be=zo(class extends Po{constructor(e){if(super(e),e.type!==ie.PROPERTY&&e.type!==ie.ATTRIBUTE&&e.type!==ie.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!Qr(e))throw Error("`live` bindings can only contain a single expression")}render(e){return e}update(e,[t]){if(t===D||t===l)return t;const o=e.element,i=e.name;if(e.type===ie.PROPERTY){if(t===o[i])return D}else if(e.type===ie.BOOLEAN_ATTRIBUTE){if(!!t===o.hasAttribute(i))return D}else if(e.type===ie.ATTRIBUTE&&o.getAttribute(i)===t+"")return D;return tn(e),t}});async function on(){var e,t,o,i;if(!customElements.get("ha-entity-picker"))try{const s=window.loadCardHelpers;if(s){const a=await s(),r=await((e=a==null?void 0:a.createCardElement)==null?void 0:e.call(a,{type:"entities",entities:[]}));if(await((t=r==null?void 0:r.getConfigElement)==null?void 0:t.call(r)),!customElements.get("ha-entity-picker")&&(a!=null&&a.createRowElement)){const n=await a.createRowElement({type:"attribute"});await((o=n==null?void 0:n.getConfigElement)==null?void 0:o.call(n))}}if(!customElements.get("ha-entity-picker")){const a=customElements.get("hui-glance-card");await((i=a==null?void 0:a.getConfigElement)==null?void 0:i.call(a))}}catch(s){console.warn("[climate-group-helper-card] Failed to preload HA form components:",s)}}var sn=Object.defineProperty,an=Object.getOwnPropertyDescriptor,Re=(e,t,o,i)=>{for(var s=i>1?void 0:i?an(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&sn(t,o,s),s};const rn={panel:"editor.section.panel",badges:"editor.section.badges",deviations:"editor.section.deviations"},Di={slider:"editor.control.slider",buttons:"editor.control.buttons",toggle:"editor.control.toggle"},nn={title:"editor.name",slider:"editor.control.slider",boost:"editor.boost",reset:"editor.reset"},ln=Bt.filter(e=>e!=="slider"),zi={offset:!1,temperature:!1,humidity:!1},cn={offset:!0,temperature:!0,humidity:!0},dn={mode:"tile.mode",preset:"tile.preset",fan:"tile.fan",swing:"tile.swing",swing_horizontal:"tile.swing_horizontal"};let le=class extends j(x){constructor(){super(...arguments),this._open={title:!1,slider:!1,boost:!1,reset:!1}}setConfig(e){this._config=e}connectedCallback(){super.connectedCallback(),on().then(()=>this.requestUpdate())}_emit(e){if(!this._config)return;const t={...this._config,...e};t.name===""&&delete t.name,t.title!==!1&&delete t.title,t.more_info!==!1&&delete t.more_info,t.battery!==!1&&delete t.battery,t.temperature!==!1&&delete t.temperature,t.humidity!==!1&&delete t.humidity,t.reset===void 0&&delete t.reset,t.boost===void 0&&delete t.boost,t.main_switch!==!0&&delete t.main_switch,t.offset!==!0&&delete t.offset,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}_entityChanged(e){this._emit({entity:e.detail.value})}_titleChanged(e){this._emit({title:e.target.checked})}_moreInfoChanged(e){this._emit({more_info:e.target.checked})}_nameChanged(e){this._emit({name:e.target.value})}_demoChanged(e){var o;const t=e.target.checked;if(!t&&!((o=this._config)!=null&&o.entity)){this.requestUpdate();return}this._emit({demo:t})}_sectionChanged(e,t){const o=t.target.checked,i=Ut(this._config)??[];this._emit({status:o?[...i,e]:i.filter(s=>s!==e)})}_batteryChanged(e){this._emit({battery:e.target.checked})}_controlChanged(e,t){const o=t.target.checked;if(e==="toggle"){this._emit(this._viewsPatch(o?cn:zi));return}const i=_e(this._config);this._emit({controls:o?[...i,e]:i.filter(s=>s!==e)})}_viewsOn(){const e=_e(this._config).includes("toggle");return{offset:e&&ci(this._config),temperature:e&&di(this._config),humidity:e&&ui(this._config)}}_viewsPatch(e){const t=_e(this._config).filter(o=>o!=="toggle");return Object.values(e).some(Boolean)?{controls:[...t,"toggle"],offset:e.offset,temperature:e.temperature,humidity:e.humidity}:{controls:t,offset:!1,temperature:void 0,humidity:void 0}}_viewChanged(e,t){const o=t.target.checked,s=_e(this._config).includes("toggle")?this._viewsOn():{...zi};s[e]=o,this._emit(this._viewsPatch(s))}_mainSwitchChanged(e){this._emit({main_switch:e.target.checked})}get _unit(){var e,t,o;return((o=(t=(e=this.hass)==null?void 0:e.config)==null?void 0:t.unit_system)==null?void 0:o.temperature)??"°C"}get _boostRaw(){return Zt(this._config)?this._config.boost:{}}get _boostAbsolute(){const e=this._boostRaw;return e.temperature!==void 0&&e.temperature_offset===void 0}get _boostDuration(){const e=this._boostRaw.duration;return typeof e=="number"&&Number.isInteger(e)&&e>=1?e:hi}_boostChanged(e){const t=e.target.checked;this._emit({boost:t?{...st(this._unit)}:void 0})}_boostKindChanged(e){const t=this._boostDuration;this._emit({boost:e?{temperature:mi(this._unit),duration:t}:{temperature_offset:st(this._unit).temperature_offset,duration:t}})}_number(e){const t=e.target,o=t.value.trim()===""?NaN:Number(t.value);if(Number.isFinite(o))return o;this.requestUpdate()}get _boostLimit(){const e=pi(this._unit);return this._boostAbsolute?e.temperature:e.temperature_offset}_boostValueChanged(e){const t=this._number(e);if(t===void 0)return;const[o,i]=this._boostLimit,s=Math.min(i,Math.max(o,t)),a=this._boostDuration,r=this._boostAbsolute?{temperature:s,duration:a}:{temperature_offset:s,duration:a};this._emit({boost:r}),this.requestUpdate()}_boostDurationChanged(e){const t=this._number(e);if(t===void 0)return;const o=Math.min(Wt,Math.max(1,Math.round(t))),i=this._boostRaw,s=this._boostAbsolute?{temperature:typeof i.temperature=="number"&&Number.isFinite(i.temperature)?i.temperature:mi(this._unit),duration:o}:{temperature_offset:typeof i.temperature_offset=="number"&&Number.isFinite(i.temperature_offset)?i.temperature_offset:st(this._unit).temperature_offset,duration:o};this._emit({boost:s}),this.requestUpdate()}_resetChanged(e){const t=e.target.checked;this._emit({reset:t?[...Nt]:void 0})}_resetFieldChanged(e,t){const o=t.target.checked,i=Kt(this._config);this._emit({reset:jt.filter(s=>s===e?o:i.includes(s))})}_tileChanged(e,t){const o=t.target.checked,i=Ft(this._config);this._emit({features:o?[...i,e]:i.filter(s=>s!==e)})}_toggleOpen(e){this._open={...this._open,[e]:!this._open[e]}}_row(e,t){const o=t?this._open[t]:!1;return c`<div class="row">
      ${t?c`<button
              type="button"
              class="chevron ${t} ${o?"open":""}"
              aria-expanded=${o?"true":"false"}
              aria-label=${this.t(nn[t])}
              @click=${()=>this._toggleOpen(t)}
            >
              <svg viewBox="0 0 24 24"><path d=${xa} /></svg>
            </button>`:c`<span class="gutter"></span>`}
      ${e}
    </div>`}render(){if(!this._config)return l;const e=ai(this._config),t=Ut(this._config),o=Ft(this._config),i=_e(this._config),s=i.includes("slider"),a=li(this._config),r=this._viewsOn(),n=Xa(this._config),d=Kt(this._config),u=Zt(this._config),f=this._boostAbsolute,h=this._boostRaw,g=f?h.temperature:h.temperature_offset,y=h.duration;return c`
      <div class="form">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity??""}
          .includeDomains=${["climate"]}
          allow-custom-entity
          .label=${this.t("editor.group_entity")}
          @value-changed=${this._entityChanged}
        ></ha-entity-picker>

        <label class="check">
          <input
            type="checkbox"
            .checked=${Be(this._config.demo===!0)}
            @change=${this._demoChanged}
          />
          <span>${this.t("editor.demo")}</span>
        </label>

        <div class="hint advanced-note">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d=${Ta} /></svg>
          <span>${this.t("editor.advanced_note")}</span>
        </div>

        <fieldset class="header">
          <legend>${this.t("editor.header")}</legend>
          <div class="sub">
            ${this._row(c`<label class="check">
                <input
                  type="checkbox"
                  class="title-toggle"
                  .checked=${e}
                  @change=${this._titleChanged}
                />
                <span>${this.t("editor.name")}</span>
              </label>`,"title")}
            ${this._open.title?c`<div class="children">
                    <label class="field ${e?"":"off"}">
                      <span>${this.t("editor.custom_name")}</span>
                      <input
                        type="text"
                        class="name-input"
                        .value=${this._config.name??""}
                        placeholder=${this.t("editor.title_placeholder")}
                        ?disabled=${!e}
                        @input=${this._nameChanged}
                      />
                    </label>
                  </div>`:l}
          </div>
        </fieldset>

        <fieldset class="controls">
          <legend>${this.t("editor.controls")}</legend>
          <div class="sub">
            ${this._row(c`<label class="check">
              <input
                type="checkbox"
                class="main-switch"
                .checked=${a}
                @change=${this._mainSwitchChanged}
              />
              <span>${this.t("editor.main_switch")}</span>
            </label>`)}
            ${this._row(c`<label class="check">
              <input
                type="checkbox"
                class="more-info-toggle"
                .checked=${ri(this._config)}
                @change=${this._moreInfoChanged}
              />
              <span>${this.t("editor.more_info")}</span>
            </label>`)}
            ${this._row(c`<label class="check">
                <input
                  type="checkbox"
                  .checked=${s}
                  @change=${b=>this._controlChanged("slider",b)}
                />
                <span>${this.t(Di.slider)}</span>
              </label>`,"slider")}
            ${this._open.slider?c`<div class="children">
                    ${ln.map(b=>c`
                        <label class="check ${s?"":"off"}">
                          <input
                            type="checkbox"
                            .checked=${i.includes(b)}
                            ?disabled=${!s}
                            @change=${C=>this._controlChanged(b,C)}
                          />
                          <span>${this.t(Di[b])}</span>
                        </label>
                      `)}
                    <label class="check nested ${s?"":"off"}">
                      <input
                        type="checkbox"
                        class="offset"
                        .checked=${r.offset}
                        ?disabled=${!s}
                        @change=${b=>this._viewChanged("offset",b)}
                      />
                      <span>${this.t("editor.offset")}</span>
                    </label>
                    <label class="check nested ${s?"":"off"}">
                      <input
                        type="checkbox"
                        class="view-temperature"
                        .checked=${r.temperature}
                        ?disabled=${!s}
                        @change=${b=>this._viewChanged("temperature",b)}
                      />
                      <span>${this.t("common.temperature")}</span>
                    </label>
                    <label class="check nested ${s?"":"off"}">
                      <input
                        type="checkbox"
                        class="view-humidity"
                        .checked=${r.humidity}
                        ?disabled=${!s}
                        @change=${b=>this._viewChanged("humidity",b)}
                      />
                      <span>${this.t("common.humidity")}</span>
                    </label>
                  </div>`:l}
            ${Rt.map(b=>this._row(c`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${o.includes(b)}
                    @change=${C=>this._tileChanged(b,C)}
                  />
                  <span>${this.t(dn[b])}</span>
                </label>
              `))}
            ${this._row(c`<label class="check">
                <input
                  type="checkbox"
                  class="boost"
                  .checked=${u}
                  @change=${this._boostChanged}
                />
                <span>${this.t("editor.boost")}</span>
              </label>`,"boost")}
            ${this._open.boost?c`<div class="children ${u?"":"off"}">
                    <label class="check">
                      <input
                        type="radio"
                        name="boost-kind"
                        class="boost-relative"
                        .checked=${Be(!f)}
                        ?disabled=${!u}
                        @change=${()=>this._boostKindChanged(!1)}
                      />
                      <span>${this.t("editor.boost_relative")}</span>
                    </label>
                    <label class="check">
                      <input
                        type="radio"
                        name="boost-kind"
                        class="boost-absolute"
                        .checked=${Be(f)}
                        ?disabled=${!u}
                        @change=${()=>this._boostKindChanged(!0)}
                      />
                      <span>${this.t("editor.boost_absolute")}</span>
                    </label>
                    <label class="number">
                      <span>${this.t(f?"common.temperature":"offset.label")}</span>
                      <input
                        type="number"
                        class="boost-value"
                        min=${this._boostLimit[0]}
                        max=${this._boostLimit[1]}
                        step="0.5"
                        .value=${Be(typeof g=="number"?String(g):"")}
                        ?disabled=${!u}
                        @change=${this._boostValueChanged}
                      />
                      <span class="unit">${this._unit}</span>
                    </label>
                    <label class="number">
                      <span>${this.t("editor.boost_duration")}</span>
                      <input
                        type="number"
                        class="boost-duration"
                        min="1"
                        max=${Wt}
                        step="1"
                        .value=${Be(typeof y=="number"?String(y):"")}
                        ?disabled=${!u}
                        @change=${this._boostDurationChanged}
                      />
                      <span class="unit">min</span>
                    </label>
                  </div>`:l}
            ${u&&!fi(this._config,this._unit)?c`<div class="hint boost-invalid-hint indent">
                    ${this.t("editor.boost_invalid")}
                  </div>`:l}
            ${this._row(c`<label class="check">
                <input
                  type="checkbox"
                  class="reset"
                  .checked=${n}
                  @change=${this._resetChanged}
                />
                <span>${this.t("editor.reset")}</span>
              </label>`,"reset")}
            ${this._open.reset?c`<div class="children">
                    ${jt.map(b=>c`
                        <label class="check ${n?"":"off"}">
                          <input
                            type="checkbox"
                            class="reset-field"
                            .checked=${d.includes(b)}
                            ?disabled=${!n}
                            @change=${C=>this._resetFieldChanged(b,C)}
                          />
                          <span>${this.t(si[b])}</span>
                        </label>
                      `)}
                  </div>`:l}
            ${n&&!d.length?c`<div class="hint reset-hint indent">${this.t("editor.reset_empty")}</div>`:l}
          </div>
        </fieldset>

        <fieldset class="status">
          <legend>${this.t("editor.status_cell")}</legend>
          <div class="sub">
            ${It.map(b=>c`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${(t==null?void 0:t.includes(b))??!1}
                    @change=${C=>this._sectionChanged(b,C)}
                  />
                  <span>${this.t(rn[b])}</span>
                </label>
              `)}
            <label class="check">
              <input
                type="checkbox"
                class="battery"
                .checked=${ni(this._config)}
                @change=${this._batteryChanged}
              />
              <span>${this.t("editor.battery")}</span>
            </label>
          </div>
        </fieldset>
      </div>
    `}};le.styles=$`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    ha-entity-picker {
      display: block;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field span,
    legend {
      font-size: var(--ha-font-size-s, 0.75rem);
      color: var(--secondary-text-color);
    }
    .field input,
    .number input {
      padding: 8px 10px;
      border: 1px solid
        var(--divider-color, color-mix(in srgb, var(--primary-text-color) 20%, transparent));
      border-radius: var(--ha-border-radius-sm, 8px);
      background: var(--secondary-background-color, transparent);
      color: var(--primary-text-color);
      font: inherit;
    }
    .number {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .number > span:first-child {
      min-width: 6em;
    }
    .number input {
      width: 6em;
      padding: 4px 8px;
    }
    .children.off .number,
    .children.off .check {
      opacity: 0.5;
    }
    fieldset {
      margin: 0;
      padding: 8px 12px;
      border: 1px solid
        var(--divider-color, color-mix(in srgb, var(--primary-text-color) 12%, transparent));
      border-radius: var(--ha-border-radius-md, 12px);
    }
    .sub {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
    }
    .check.off,
    .field.off {
      opacity: 0.5;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .gutter,
    .chevron {
      flex: none;
      width: 20px;
      height: 20px;
    }
    .chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .chevron.open {
      transform: rotate(90deg);
    }
    .chevron svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    /* An expanded row's options: one step in from its checkbox (24px), along
       a dashed guide below the chevron. */
    .children {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-left: 9px;
      padding-left: 38px;
      border-left: 1px dashed
        var(--divider-color, color-mix(in srgb, var(--primary-text-color) 20%, transparent));
    }
    /* The views are the view switch's segments. */
    .nested {
      padding-left: 24px;
    }
    /* Hints stay outside the collapsed options, at their level. */
    .indent {
      padding-left: 48px;
    }
    .indent-2 {
      padding-left: 72px;
    }
    .hint {
      font-size: var(--ha-font-size-s, 0.75rem);
      color: var(--secondary-text-color);
    }
    .advanced-note {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .advanced-note svg {
      flex: none;
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
  `,Re([m({attribute:!1})],le.prototype,"hass",2),Re([m({attribute:!1})],le.prototype,"lovelace",2),Re([M()],le.prototype,"_config",2),Re([M()],le.prototype,"_open",2),le=Re([E("climate-group-helper-card-editor")],le);var un=Object.defineProperty,hn=Object.getOwnPropertyDescriptor,rt=(e,t,o,i)=>{for(var s=i>1?void 0:i?hn(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&un(t,o,s),s};let ye=class extends x{constructor(){super(...arguments),this.checked=!1,this.disabled=!1,this.label=""}_tap(){this.disabled||this.dispatchEvent(new CustomEvent("cgh-toggle",{detail:{checked:!this.checked},bubbles:!0,composed:!0}))}render(){return c`
      <button
        class="toggle ${this.checked?"checked":""}"
        role="switch"
        aria-checked=${this.checked?"true":"false"}
        aria-label=${this.label}
        title=${this.label}
        ?disabled=${this.disabled}
        @click=${this._tap}
      >
        <span class="track"><span class="thumb"></span></span>
      </button>
    `}};ye.styles=$`
    :host {
      display: inline-block;
      /* A notch smaller than ha-switch's 48×24: it sits next to the title. */
      --cgh-toggle-width: 40px;
      --cgh-toggle-height: 20px;
      --cgh-toggle-thumb: 14px;
    }
    .toggle {
      /* At least 40px to tap, like ha-switch. */
      min-width: 40px;
      min-height: 40px;
      padding: 0;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .toggle:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .track {
      position: relative;
      box-sizing: border-box;
      width: var(--cgh-toggle-width);
      height: var(--cgh-toggle-height);
      border-radius: calc(var(--cgh-toggle-height) / 2);
      border: 1px solid
        var(--ha-color-border-neutral-normal, var(--secondary-text-color));
      background-color: var(
        --ha-color-fill-disabled-quiet-resting,
        color-mix(in srgb, var(--primary-text-color) 15%, transparent)
      );
      transition: background-color 150ms, border-color 150ms;
    }
    .thumb {
      position: absolute;
      top: 50%;
      left: 2px;
      width: var(--cgh-toggle-thumb);
      height: var(--cgh-toggle-thumb);
      border-radius: 50%;
      transform: translateY(-50%);
      background-color: var(--ha-color-on-neutral-normal, var(--secondary-text-color));
      box-shadow: var(--ha-box-shadow-s, 0 1px 2px rgba(0, 0, 0, 0.3));
      transition: left 150ms, background-color 150ms;
    }
    .toggle:not(:disabled):hover .track,
    .toggle:focus-visible .track {
      background-color: var(
        --ha-color-fill-disabled-quiet-hover,
        color-mix(in srgb, var(--primary-text-color) 22%, transparent)
      );
    }
    .checked .track {
      border-color: var(--ha-color-border-primary-loud, var(--primary-color));
      background-color: var(--ha-color-fill-primary-normal-resting, var(--primary-color));
    }
    .checked:not(:disabled):hover .track,
    .checked:focus-visible .track {
      background-color: var(
        --ha-color-fill-primary-normal-hover,
        color-mix(in srgb, var(--primary-color) 85%, var(--primary-text-color))
      );
    }
    .checked .thumb {
      left: calc(var(--cgh-toggle-width) - var(--cgh-toggle-thumb) - 4px);
      background-color: var(
        --ha-color-on-primary-normal,
        var(--text-primary-color, #fff)
      );
    }
    .toggle:focus-visible {
      outline: none;
    }
    .toggle:focus-visible .track {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
  `,rt([m({type:Boolean})],ye.prototype,"checked",2),rt([m({type:Boolean})],ye.prototype,"disabled",2),rt([m()],ye.prototype,"label",2),ye=rt([E("cgh-toggle")],ye);var mn=Object.defineProperty,pn=Object.getOwnPropertyDescriptor,so=(e,t,o,i)=>{for(var s=i>1?void 0:i?pn(t,o):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(s=(i?r(t,o,s):r(s))||s);return i&&s&&mn(t,o,s),s};const fn=new Set(["type","entity","name","title","more_info","status","features","controls","battery","main_switch","offset","temperature","humidity","boost","reset","demo"]);let je=class extends j(x){setConfig(e){if(!e.entity&&!e.demo)throw new Error('climate-group-helper-card: "entity" is required');for(const t of Object.keys(e))fn.has(t)||console.warn(`[climate-group-helper-card] ignoring unknown config key: ${t}`);this._config=e,this._syncDemoTimer()}connectedCallback(){super.connectedCallback(),this._syncDemoTimer()}disconnectedCallback(){super.disconnectedCallback(),this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_syncDemoTimer(){var t;const e=!!((t=this._config)!=null&&t.demo);e&&this._demoTimer===void 0?(this._demoTimer=window.setInterval(()=>this.requestUpdate(),Si),this.requestUpdate()):!e&&this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_entityId(){var e,t;return(e=this._config)!=null&&e.demo?Xt:(t=this._config)==null?void 0:t.entity}_effectiveHass(){var e,t;if(this.hass)return(e=this._config)!=null&&e.demo?{...this.hass,states:{...this.hass.states,...Xr(Date.now(),((t=this.hass.locale)==null?void 0:t.language)??this.hass.language)},entities:Tr,callService:async()=>{}}:this.hass}getCardSize(){return 6}static getStubConfig(e,t=[],o=[]){var d,u,f;const i="custom:climate-group-helper-card",s=[...t,...o],a=st((u=(d=e==null?void 0:e.config)==null?void 0:d.unit_system)==null?void 0:u.temperature),r=s.find(h=>{var g,y,b;return((b=(y=(g=e==null?void 0:e.states)==null?void 0:g[h])==null?void 0:y.attributes)==null?void 0:b.enabled_features)!==void 0});if(r)return Ja((f=e==null?void 0:e.states)==null?void 0:f[r])?{type:i,entity:r,main_switch:!0,offset:!0,boost:a,reset:[...Nt]}:{type:i,entity:r};const n=s.find(h=>h.startsWith("climate."));return n?{type:i,entity:n}:{type:i,demo:!0,main_switch:!0,offset:!0,boost:a,reset:[...Nt]}}_mainSwitch(e,t){if(!li(this._config))return;const o=t.attributes.main_switch_entity_id;return o?e.states[o]:void 0}_offsetEntity(e,t){if(!ci(this._config))return;const o=t.attributes.offset_entity_id;return o?e.states[o]:void 0}_handleMainSwitch(e){const t=this._effectiveHass();t&&t.callService("switch",e.state==="on"?"turn_off":"turn_on",{entity_id:e.entity_id})}static async getConfigElement(){return document.createElement("climate-group-helper-card-editor")}_renderStatus(e,t){var i;const o=Ut(this._config);return!o||!o.length?l:c`
      <div class="status">
        <cgh-status
          .hass=${e}
          .stateObj=${t}
          .sections=${o}
          .battery=${ni(this._config)}
          .navigable=${!((i=this._config)!=null&&i.demo)}
        ></cgh-status>
      </div>
    `}_handleMoreInfo(){var t;const e=this._entityId();!e||(t=this._config)!=null&&t.demo||this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0}))}render(){var d,u;const e=this._effectiveHass(),t=this._entityId();if(!this._config||!e||!t)return l;const o=e.states[t],i=_e(this._config);if(!o)return c`<ha-card class="warning"
        >${this.t("card.entity_not_found",{entity:t})}</ha-card
      >`;const s=this._mainSwitch(e,o),a=this._config.name??o.attributes.friendly_name??t,r=ai(this._config),n=r?"in-header":"";return c`
      <ha-card>
        <div class="grid ${r?"":"no-header"}">
          ${r?c`<div class="title ${s?"with-switch":""}">${a}</div>`:c`<span class="sr-only">${a}</span>`}
          ${s?c`<cgh-toggle
                  class="main-switch ${n}"
                  .checked=${s.state==="on"}
                  .disabled=${s.state==="unavailable"||s.state==="unknown"}
                  .label=${this.t("main_switch.label")}
                  @cgh-toggle=${()=>this._handleMainSwitch(s)}
                ></cgh-toggle>`:l}
          ${ri(this._config)&&!this._config.demo?c`<button
                  class="more-info ${n}"
                  aria-label=${this.t("card.more_info")}
                  @click=${this._handleMoreInfo}
                >
                  <svg viewBox="0 0 24 24">
                    <path d=${$a} />
                  </svg>
                </button>`:l}
          ${i.includes("slider")?c`<div class="center">
                  <cgh-climate-control
                    .hass=${e}
                    .stateObj=${o}
                    .controls=${i}
                    .offsetObj=${this._offsetEntity(e,o)}
                    .showTemperature=${di(this._config)}
                    .showHumidity=${ui(this._config)}
                  ></cgh-climate-control>
                </div>`:l}
          <div class="features">
            <cgh-feature-tiles
              .hass=${e}
              .stateObj=${o}
              .tiles=${Ft(this._config)}
              .boost=${fi(this._config,(u=(d=e.config)==null?void 0:d.unit_system)==null?void 0:u.temperature)}
              .reset=${Kt(this._config)}
            ></cgh-feature-tiles>
          </div>
          ${this._renderStatus(e,o)}
        </div>
      </ha-card>
    `}};je.styles=$`
    :host {
      display: block;
      height: 100%;
      /* Shared content column: the dial and everything below it stay within
         this width, centred — nothing is drawn past the slider's edges. */
      --cgh-content-width: 320px;
    }
    /* HA's own ha-card is a block already; outside HA (the dev demo) it is an
       unknown inline element, on which the height would not apply. */
    ha-card {
      display: block;
      padding: 0;
      height: 100%;
    }
    /* Blocks carry 8px padding each, so 16px between them; the grid's 8px
       give the last block, whichever it is, the same 16px to the edge — and
       the first one at the top unless the header leads (its padding and the
       title's line height make that space already). */
    .grid {
      box-sizing: border-box;
      padding-bottom: 8px;
      container-type: inline-size;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto auto 1fr auto auto;
      grid-template-areas:
        "header"
        "switch"
        "center"
        "features"
        "status";
      height: 100%;
    }
    .grid.no-header {
      padding-top: 8px;
    }
    .more-info {
      width: 48px;
      height: 48px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .more-info:hover,
    .more-info:focus-visible {
      /* Light, theme-adaptive fill (like HA's own header buttons) — not the
         dark secondary surface, which read as a black circle. */
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      color: var(--primary-text-color);
      outline: none;
    }
    .more-info svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
    /* The title alone sets the header row's height, at least the 48px of the
       ⋮ — also for a blank name — and the corners centre in it. Symmetrical
       48px padding keeps it centred and clear of the ⋮. */
    .title {
      grid-area: header;
      box-sizing: border-box;
      min-height: 48px;
      padding: 8px 48px;
      font-size: var(--ha-font-size-l, 1.1rem);
      font-weight: 400;
      line-height: var(--ha-line-height-expanded, 2);
      text-align: center;
    }
    /* 12px edge + 40px switch + 8px air, mirrored to keep the title centred. */
    .title.with-switch {
      padding-left: 60px;
      padding-right: 60px;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
    .center,
    .features,
    .status {
      justify-self: center;
      width: 100%;
      max-width: calc(var(--cgh-content-width) + 16px);
      box-sizing: border-box;
    }
    .center {
      grid-area: center;
      align-self: center;
      min-width: 0;
      padding: 8px;
    }
    /* The switch top left, 12px from the card edge, the ⋮ top right, both
       centred on the same line. Without the name they go to the corners of
       the dial's area, clear of the ring from 320px card width on; without
       the dial they stand above the feature tiles. */
    .main-switch,
    .more-info {
      grid-area: center;
      align-self: start;
      z-index: 1;
    }
    .main-switch {
      justify-self: start;
      margin: 4px 0 0 12px;
    }
    .more-info {
      justify-self: end;
    }
    /* Narrower, the ring reaches the corners: they take a row of their own. */
    @container (max-width: 319px) {
      .main-switch,
      .more-info {
        grid-area: switch;
      }
    }
    /* After the container query: the header row wins at every width. */
    .main-switch.in-header,
    .more-info.in-header {
      grid-area: header;
      align-self: center;
      margin-top: 0;
    }
    /* No padding here: the tiles' row carries it, so a card whose tiles all
       drop out leaves no gap. */
    .features {
      grid-area: features;
    }
    .status {
      grid-area: status;
    }
    .warning {
      color: var(--error-color, #db4437);
    }
  `,so([m({attribute:!1})],je.prototype,"hass",2),so([M()],je.prototype,"_config",2),je=so([E("climate-group-helper-card")],je),ks({type:"climate-group-helper-card",name:"Climate Group Helper Card",description:"Dial, status and controls for a Climate Group Helper group.",preview:!0})})();
