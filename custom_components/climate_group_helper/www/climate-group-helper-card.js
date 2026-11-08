(function(){"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var ii;const ze=globalThis,st=ze.ShadowRoot&&(ze.ShadyCSS===void 0||ze.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,at=Symbol(),Yt=new WeakMap;let qt=class{constructor(e,o,i){if(this._$cssResult$=!0,i!==at)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=o}get styleSheet(){let e=this.o;const o=this.t;if(st&&e===void 0){const i=o!==void 0&&o.length===1;i&&(e=Yt.get(o)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&Yt.set(o,e))}return e}toString(){return this.cssText}};const xi=t=>new qt(typeof t=="string"?t:t+"",void 0,at),A=(t,...e)=>{const o=t.length===1?t[0]:e.reduce((i,s,a)=>i+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[a+1],t[0]);return new qt(o,t,at)},Ai=(t,e)=>{if(st)t.adoptedStyleSheets=e.map(o=>o instanceof CSSStyleSheet?o:o.styleSheet);else for(const o of e){const i=document.createElement("style"),s=ze.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=o.cssText,t.appendChild(i)}},Jt=st?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let o="";for(const i of e.cssRules)o+=i.cssText;return xi(o)})(t):t;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Ci,defineProperty:Ei,getOwnPropertyDescriptor:Si,getOwnPropertyNames:Oi,getOwnPropertySymbols:Mi,getPrototypeOf:Ti}=Object,R=globalThis,Qt=R.trustedTypes,Li=Qt?Qt.emptyScript:"",nt=R.reactiveElementPolyfillSupport,we=(t,e)=>t,De={toAttribute(t,e){switch(e){case Boolean:t=t?Li:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let o=t;switch(e){case Boolean:o=t!==null;break;case Number:o=t===null?null:Number(t);break;case Object:case Array:try{o=JSON.parse(t)}catch{o=null}}return o}},rt=(t,e)=>!Ci(t,e),Xt={attribute:!0,type:String,converter:De,reflect:!1,useDefault:!1,hasChanged:rt};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),R.litPropertyMetadata??(R.litPropertyMetadata=new WeakMap);let ne=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,o=Xt){if(o.state&&(o.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((o=Object.create(o)).wrapped=!0),this.elementProperties.set(e,o),!o.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,o);s!==void 0&&Ei(this.prototype,e,s)}}static getPropertyDescriptor(e,o,i){const{get:s,set:a}=Si(this.prototype,e)??{get(){return this[o]},set(n){this[o]=n}};return{get:s,set(n){const r=s==null?void 0:s.call(this);a==null||a.call(this,n),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Xt}static _$Ei(){if(this.hasOwnProperty(we("elementProperties")))return;const e=Ti(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(we("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(we("properties"))){const o=this.properties,i=[...Oi(o),...Mi(o)];for(const s of i)this.createProperty(s,o[s])}const e=this[Symbol.metadata];if(e!==null){const o=litPropertyMetadata.get(e);if(o!==void 0)for(const[i,s]of o)this.elementProperties.set(i,s)}this._$Eh=new Map;for(const[o,i]of this.elementProperties){const s=this._$Eu(o,i);s!==void 0&&this._$Eh.set(s,o)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const o=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const s of i)o.unshift(Jt(s))}else e!==void 0&&o.push(Jt(e));return o}static _$Eu(e,o){const i=o.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(o=>this.enableUpdating=o),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(o=>o(this))}addController(e){var o;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((o=e.hostConnected)==null||o.call(e))}removeController(e){var o;(o=this._$EO)==null||o.delete(e)}_$E_(){const e=new Map,o=this.constructor.elementProperties;for(const i of o.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ai(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(o=>{var i;return(i=o.hostConnected)==null?void 0:i.call(o)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(o=>{var i;return(i=o.hostDisconnected)==null?void 0:i.call(o)})}attributeChangedCallback(e,o,i){this._$AK(e,i)}_$ET(e,o){var a;const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(s!==void 0&&i.reflect===!0){const n=(((a=i.converter)==null?void 0:a.toAttribute)!==void 0?i.converter:De).toAttribute(o,i.type);this._$Em=e,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(e,o){var a,n;const i=this.constructor,s=i._$Eh.get(e);if(s!==void 0&&this._$Em!==s){const r=i.getPropertyOptions(s),l=typeof r.converter=="function"?{fromAttribute:r.converter}:((a=r.converter)==null?void 0:a.fromAttribute)!==void 0?r.converter:De;this._$Em=s;const p=l.fromAttribute(o,r.type);this[s]=p??((n=this._$Ej)==null?void 0:n.get(s))??p,this._$Em=null}}requestUpdate(e,o,i,s=!1,a){var n;if(e!==void 0){const r=this.constructor;if(s===!1&&(a=this[e]),i??(i=r.getPropertyOptions(e)),!((i.hasChanged??rt)(a,o)||i.useDefault&&i.reflect&&a===((n=this._$Ej)==null?void 0:n.get(e))&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,o,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,o,{useDefault:i,reflect:s,wrapped:a},n){i&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,n??o??this[e]),a!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(o=void 0),this._$AL.set(e,o)),s===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(o){Promise.reject(o)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[a,n]of this._$Ep)this[a]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[a,n]of s){const{wrapped:r}=n,l=this[a];r!==!0||this._$AL.has(a)||l===void 0||this.C(a,void 0,n,l)}}let e=!1;const o=this._$AL;try{e=this.shouldUpdate(o),e?(this.willUpdate(o),(i=this._$EO)==null||i.forEach(s=>{var a;return(a=s.hostUpdate)==null?void 0:a.call(s)}),this.update(o)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(o)}willUpdate(e){}_$AE(e){var o;(o=this._$EO)==null||o.forEach(i=>{var s;return(s=i.hostUpdated)==null?void 0:s.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(o=>this._$ET(o,this[o]))),this._$EM()}updated(e){}firstUpdated(e){}};ne.elementStyles=[],ne.shadowRootOptions={mode:"open"},ne[we("elementProperties")]=new Map,ne[we("finalized")]=new Map,nt==null||nt({ReactiveElement:ne}),(R.reactiveElementVersions??(R.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ke=globalThis,eo=t=>t,je=ke.trustedTypes,to=je?je.createPolicy("lit-html",{createHTML:t=>t}):void 0,oo="$lit$",I=`lit$${Math.random().toFixed(9).slice(2)}$`,io="?"+I,Hi=`<${io}>`,W=document,$e=()=>W.createComment(""),xe=t=>t===null||typeof t!="object"&&typeof t!="function",lt=Array.isArray,Pi=t=>lt(t)||typeof(t==null?void 0:t[Symbol.iterator])=="function",ct=`[ 	
\f\r]`,Ae=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,so=/-->/g,ao=/>/g,Z=RegExp(`>|${ct}(?:([^\\s"'>=/]+)(${ct}*=${ct}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),no=/'/g,ro=/"/g,lo=/^(?:script|style|textarea|title)$/i,co=t=>(e,...o)=>({_$litType$:t,strings:e,values:o}),d=co(1),re=co(2),M=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),uo=new WeakMap,G=W.createTreeWalker(W,129);function ho(t,e){if(!lt(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return to!==void 0?to.createHTML(e):e}const Vi=(t,e)=>{const o=t.length-1,i=[];let s,a=e===2?"<svg>":e===3?"<math>":"",n=Ae;for(let r=0;r<o;r++){const l=t[r];let p,f,u=-1,_=0;for(;_<l.length&&(n.lastIndex=_,f=n.exec(l),f!==null);)_=n.lastIndex,n===Ae?f[1]==="!--"?n=so:f[1]!==void 0?n=ao:f[2]!==void 0?(lo.test(f[2])&&(s=RegExp("</"+f[2],"g")),n=Z):f[3]!==void 0&&(n=Z):n===Z?f[0]===">"?(n=s??Ae,u=-1):f[1]===void 0?u=-2:(u=n.lastIndex-f[2].length,p=f[1],n=f[3]===void 0?Z:f[3]==='"'?ro:no):n===ro||n===no?n=Z:n===so||n===ao?n=Ae:(n=Z,s=void 0);const $=n===Z&&t[r+1].startsWith("/>")?" ":"";a+=n===Ae?l+Hi:u>=0?(i.push(p),l.slice(0,u)+oo+l.slice(u)+I+$):l+I+(u===-2?r:$)}return[ho(t,a+(t[o]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]};class Ce{constructor({strings:e,_$litType$:o},i){let s;this.parts=[];let a=0,n=0;const r=e.length-1,l=this.parts,[p,f]=Vi(e,o);if(this.el=Ce.createElement(p,i),G.currentNode=this.el.content,o===2||o===3){const u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(s=G.nextNode())!==null&&l.length<r;){if(s.nodeType===1){if(s.hasAttributes())for(const u of s.getAttributeNames())if(u.endsWith(oo)){const _=f[n++],$=s.getAttribute(u).split(I),L=/([.?@])?(.*)/.exec(_);l.push({type:1,index:a,name:L[2],strings:$,ctor:L[1]==="."?Di:L[1]==="?"?ji:L[1]==="@"?Ri:Re}),s.removeAttribute(u)}else u.startsWith(I)&&(l.push({type:6,index:a}),s.removeAttribute(u));if(lo.test(s.tagName)){const u=s.textContent.split(I),_=u.length-1;if(_>0){s.textContent=je?je.emptyScript:"";for(let $=0;$<_;$++)s.append(u[$],$e()),G.nextNode(),l.push({type:2,index:++a});s.append(u[_],$e())}}}else if(s.nodeType===8)if(s.data===io)l.push({type:2,index:a});else{let u=-1;for(;(u=s.data.indexOf(I,u+1))!==-1;)l.push({type:7,index:a}),u+=I.length-1}a++}}static createElement(e,o){const i=W.createElement("template");return i.innerHTML=e,i}}function le(t,e,o=t,i){var n,r;if(e===M)return e;let s=i!==void 0?(n=o._$Co)==null?void 0:n[i]:o._$Cl;const a=xe(e)?void 0:e._$litDirective$;return(s==null?void 0:s.constructor)!==a&&((r=s==null?void 0:s._$AO)==null||r.call(s,!1),a===void 0?s=void 0:(s=new a(t),s._$AT(t,o,i)),i!==void 0?(o._$Co??(o._$Co=[]))[i]=s:o._$Cl=s),s!==void 0&&(e=le(t,s._$AS(t,e.values),s,i)),e}class zi{constructor(e,o){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=o}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:o},parts:i}=this._$AD,s=((e==null?void 0:e.creationScope)??W).importNode(o,!0);G.currentNode=s;let a=G.nextNode(),n=0,r=0,l=i[0];for(;l!==void 0;){if(n===l.index){let p;l.type===2?p=new Ee(a,a.nextSibling,this,e):l.type===1?p=new l.ctor(a,l.name,l.strings,this,e):l.type===6&&(p=new Ii(a,this,e)),this._$AV.push(p),l=i[++r]}n!==(l==null?void 0:l.index)&&(a=G.nextNode(),n++)}return G.currentNode=W,s}p(e){let o=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,o),o+=i.strings.length-2):i._$AI(e[o])),o++}}class Ee{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,o,i,s){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=e,this._$AB=o,this._$AM=i,this.options=s,this._$Cv=(s==null?void 0:s.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const o=this._$AM;return o!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=o.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,o=this){e=le(this,e,o),xe(e)?e===c||e==null||e===""?(this._$AH!==c&&this._$AR(),this._$AH=c):e!==this._$AH&&e!==M&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Pi(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==c&&xe(this._$AH)?this._$AA.nextSibling.data=e:this.T(W.createTextNode(e)),this._$AH=e}$(e){var a;const{values:o,_$litType$:i}=e,s=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=Ce.createElement(ho(i.h,i.h[0]),this.options)),i);if(((a=this._$AH)==null?void 0:a._$AD)===s)this._$AH.p(o);else{const n=new zi(s,this),r=n.u(this.options);n.p(o),this.T(r),this._$AH=n}}_$AC(e){let o=uo.get(e.strings);return o===void 0&&uo.set(e.strings,o=new Ce(e)),o}k(e){lt(this._$AH)||(this._$AH=[],this._$AR());const o=this._$AH;let i,s=0;for(const a of e)s===o.length?o.push(i=new Ee(this.O($e()),this.O($e()),this,this.options)):i=o[s],i._$AI(a),s++;s<o.length&&(this._$AR(i&&i._$AB.nextSibling,s),o.length=s)}_$AR(e=this._$AA.nextSibling,o){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,o);e!==this._$AB;){const s=eo(e).nextSibling;eo(e).remove(),e=s}}setConnected(e){var o;this._$AM===void 0&&(this._$Cv=e,(o=this._$AP)==null||o.call(this,e))}}class Re{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,o,i,s,a){this.type=1,this._$AH=c,this._$AN=void 0,this.element=e,this.name=o,this._$AM=s,this.options=a,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=c}_$AI(e,o=this,i,s){const a=this.strings;let n=!1;if(a===void 0)e=le(this,e,o,0),n=!xe(e)||e!==this._$AH&&e!==M,n&&(this._$AH=e);else{const r=e;let l,p;for(e=a[0],l=0;l<a.length-1;l++)p=le(this,r[i+l],o,l),p===M&&(p=this._$AH[l]),n||(n=!xe(p)||p!==this._$AH[l]),p===c?e=c:e!==c&&(e+=(p??"")+a[l+1]),this._$AH[l]=p}n&&!s&&this.j(e)}j(e){e===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Di extends Re{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===c?void 0:e}}class ji extends Re{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==c)}}class Ri extends Re{constructor(e,o,i,s,a){super(e,o,i,s,a),this.type=5}_$AI(e,o=this){if((e=le(this,e,o,0)??c)===M)return;const i=this._$AH,s=e===c&&i!==c||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,a=e!==c&&(i===c||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var o;typeof this._$AH=="function"?this._$AH.call(((o=this.options)==null?void 0:o.host)??this.element,e):this._$AH.handleEvent(e)}}class Ii{constructor(e,o,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=o,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){le(this,e)}}const dt=ke.litHtmlPolyfillSupport;dt==null||dt(Ce,Ee),(ke.litHtmlVersions??(ke.litHtmlVersions=[])).push("3.3.3");const Bi=(t,e,o)=>{const i=(o==null?void 0:o.renderBefore)??e;let s=i._$litPart$;if(s===void 0){const a=(o==null?void 0:o.renderBefore)??null;i._$litPart$=s=new Ee(e.insertBefore($e(),a),a,void 0,o??{})}return s._$AI(t),s};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Y=globalThis;let w=class extends ne{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var o;const e=super.createRenderRoot();return(o=this.renderOptions).renderBefore??(o.renderBefore=e.firstChild),e}update(e){const o=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Bi(o,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return M}};w._$litElement$=!0,w.finalized=!0,(ii=Y.litElementHydrateSupport)==null||ii.call(Y,{LitElement:w});const ut=Y.litElementPolyfillSupport;ut==null||ut({LitElement:w}),(Y.litElementVersions??(Y.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ni={attribute:!0,type:String,converter:De,reflect:!1,hasChanged:rt},Ui=(t=Ni,e,o)=>{const{kind:i,metadata:s}=o;let a=globalThis.litPropertyMetadata.get(s);if(a===void 0&&globalThis.litPropertyMetadata.set(s,a=new Map),i==="setter"&&((t=Object.create(t)).wrapped=!0),a.set(o.name,t),i==="accessor"){const{name:n}=o;return{set(r){const l=e.get.call(this);e.set.call(this,r),this.requestUpdate(n,l,t,!0,r)},init(r){return r!==void 0&&this.C(n,void 0,t,r),r}}}if(i==="setter"){const{name:n}=o;return function(r){const l=this[n];e.call(this,r),this.requestUpdate(n,l,t,!0,r)}}throw Error("Unsupported decorator location: "+i)};function m(t){return(e,o)=>typeof o=="object"?Ui(t,e,o):((i,s,a)=>{const n=s.hasOwnProperty(a);return s.constructor.createProperty(a,i),n?Object.getOwnPropertyDescriptor(s,a):void 0})(t,e,o)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function E(t){return m({...t,state:!0,attribute:!1})}const mo=document.querySelector("home-assistant")&&!customElements.get("home-assistant")?customElements.whenDefined("home-assistant"):void 0,po=(t,e)=>{customElements.get(t)||customElements.define(t,e)},C=t=>e=>{mo?mo.then(()=>po(t,e)):po(t,e)},Fi=t=>{window.customCards=window.customCards||[],window.customCards.some(e=>e.type===t.type)||window.customCards.push(t)},ce=270,fo=360-ce/2-90,P=145,ht=320,go=ht/2,mt=P*2*Math.PI*ce/360,Ie=((t,e)=>{const o=t/180*Math.PI,i=e/180*Math.PI,s=i-o,a=P*Math.cos(o),n=P*Math.sin(o),r=P*Math.cos(i),l=P*Math.sin(i);return`M ${a} ${n} A ${P} ${P} 0 ${s>Math.PI?1:0} ${s>0?1:0} ${r} ${l}`})(0,ce),pt=(t,e,o)=>o===e?0:(t-e)/(o-e),ft=(t,e,o)=>pt(t,e,o)*ce,Ki=(t,e,o,i)=>{const s=pt(t,o,i),a=pt(e,o,i),n=Math.max((a-s)*mt,0);return[`${n} ${mt-n}`,`-${s*mt-.5}`]},gt=(t,e,o,i)=>{const s=Math.round(t/i)*i;return Math.min(o,Math.max(e,Number(s.toFixed(4))))},Wi=(t,e,o)=>{if(!o.width)return 0;const i=2*(t-o.left-o.width/2)/o.width,s=2*(e-o.top-o.height/2)/o.height,a=Math.atan2(s,i)*180/Math.PI,n=(360-ce)/2,r=(a+n-fo+360)%360-n;return Math.min(1,Math.max(0,r/ce))},Zi=(t,e,o,i)=>i?Math.abs(t-e)<=Math.abs(t-o)?"low":"high":"value",Gi=(t,e,o,i)=>o?t<=e:i==="end"?e<=t:i==="start"?t<=e:!1;var Yi=Object.defineProperty,qi=Object.getOwnPropertyDescriptor,k=(t,e,o,i)=>{for(var s=i>1?void 0:i?qi(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&Yi(e,o,s),s};const bo=["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","Home","End"];let y=class extends w{constructor(){super(...arguments),this.min=5,this.max=35,this.step=.5,this.dual=!1,this.disabled=!1,this.mode="full",this.inactive=!1,this.bound="low"}willUpdate(t){t.has("value")&&this._active!=="value"&&(this._localValue=this.value),t.has("low")&&this._active!=="low"&&(this._localLow=this.low),t.has("high")&&this._active!=="high"&&(this._localHigh=this.high)}_valueFromEvent(t){var o;const e=(o=this._svg)==null?void 0:o.getBoundingClientRect();return e?this.min+Wi(t.clientX,t.clientY,e)*(this.max-this.min):this.min}_setActiveValue(t){const e=gt(t,this.min,this.max,this.step);this._active==="low"?this._localLow=Math.min(e,this._localHigh??this.max):this._active==="high"?this._localHigh=Math.max(e,this._localLow??this.min):this._localValue=e}_activeValue(){if(this._active==="low")return this._localLow;if(this._active==="high")return this._localHigh;if(this._active==="value")return this._localValue}_committedValue(){return this._active==="low"?this.low:this._active==="high"?this.high:this.value}_commit(){this._active&&(this._activeValue()!==this._committedValue()&&this._emit("changed"),this._active=void 0)}_emit(t){if(!this._active)return;const e=t==="changed"?this._activeValue():void 0;this.dispatchEvent(new CustomEvent(`${this._active}-${t}`,{detail:{value:e},bubbles:!0,composed:!0}))}_onPointerDown(t){if(this.disabled||this._active)return;const e=this._valueFromEvent(t);this._active=Zi(e,this._localLow??this.min,this._localHigh??this.max,this.dual),this._pointerId=t.pointerId,this._setActiveValue(e),t.currentTarget.setPointerCapture(t.pointerId),this._emit("changing")}_onPointerMove(t){!this._active||t.pointerId!==this._pointerId||(this._setActiveValue(this._valueFromEvent(t)),this._emit("changing"))}_onPointerUp(t){!this._active||t.pointerId!==this._pointerId||(t.currentTarget.releasePointerCapture(t.pointerId),this._pointerId=void 0,this._commit())}_onKeyDown(t){if(this.disabled||this._pointerId!==void 0||!bo.includes(t.code))return;t.preventDefault(),this._active||(this._active=this.dual?this.bound:"value");const e=this._activeValue()??this.min;switch(t.code){case"ArrowRight":case"ArrowUp":this._setActiveValue(e+this.step);break;case"ArrowLeft":case"ArrowDown":this._setActiveValue(e-this.step);break;case"Home":this._setActiveValue(this.min);break;case"End":this._setActiveValue(this.max);break}this._emit("changing")}_onKeyUp(t){this._pointerId!==void 0||!bo.includes(t.code)||this._commit()}_onBlur(){this._pointerId===void 0&&this._commit()}_fill(t,e,o,i=!1,s=!1){const[a,n]=Ki(t,e,this.min,this.max);return re`
      ${s?re`<path
              class="fill-clear"
              d=${Ie}
              stroke-dasharray=${a}
              stroke-dashoffset=${n}
            />`:c}
      <path
        class="fill ${o}${i?" active":""}"
        d=${Ie}
        stroke-dasharray=${a}
        stroke-dashoffset=${n}
      />
    `}_handle(t,e){return re`
      <circle
        class="handle-ring ${e}"
        transform="rotate(${ft(t,this.min,this.max)} 0 0)"
        cx=${P}
        cy="0"
        r="12"
      />
      <circle
        class="handle"
        transform="rotate(${ft(t,this.min,this.max)} 0 0)"
        cx=${P}
        cy="0"
        r="9"
      />
    `}_currentMarker(t){return re`<circle
      class="current"
      transform="rotate(${ft(t,this.min,this.max)} 0 0)"
      cx=${P}
      cy="0"
      r="4"
    />`}render(){const t=this.current,e=t!=null&&t>=this.min&&t<=this.max,o=e&&!this.inactive,i=this.dual?this._localLow:this._localValue,s=this.dual?this._localHigh:void 0,a=o&&i!=null&&Gi(t,i,this.dual,this.mode),n=o&&s!=null&&s<=t;return d`
      <svg
        viewBox="0 0 ${ht} ${ht}"
        class="slider"
        @keydown=${this._onKeyDown}
        @keyup=${this._onKeyUp}
        @blur=${this._onBlur}
        tabindex="0"
        role="slider"
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-valuenow=${(this.dual&&this.bound==="high"?s:i)??c}
        aria-disabled=${this.disabled}
      >
        <g
          class=${this.inactive?"inactive":""}
          transform="translate(${go} ${go}) rotate(${fo})"
        >
          <path class="track" d=${Ie} />
          ${this.dual?re`
                  ${i!=null?this._fill(this.min,i,"low",!1,!0):c}
                  ${s!=null?this._fill(s,this.max,"high",!1,!0):c}
                  ${a?this._fill(t,i,"low",!0):c}
                  ${n?this._fill(s,t,"high",!0):c}
                  ${e?this._currentMarker(t):c}
                  ${i!=null?this._handle(i,"low"):c}
                  ${s!=null?this._handle(s,"high"):c}
                `:re`
                  ${i!=null?this.mode==="end"?this._fill(i,this.max,"value",!1,!0):this.mode==="full"?this._fill(this.min,this.max,"value",!1,!0):this._fill(this.min,i,"value",!1,!0):c}
                  ${a?this.mode==="end"?this._fill(i,t,"value",!0):this._fill(t,i,"value",!0):c}
                  ${e?this._currentMarker(t):c}
                  ${i!=null?this._handle(i,"value"):c}
                `}
          <path
            class="interaction"
            d=${Ie}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          />
        </g>
      </svg>
    `}firstUpdated(){this._svg=this.renderRoot.querySelector("svg")??void 0}};y.styles=A`
    :host {
      display: block;
      --cgh-slider-track: var(--disabled-color, #9e9e9e);
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
      touch-action: none;
      cursor: pointer;
    }
    :host([disabled]) .interaction {
      cursor: default;
    }
    g {
      fill: none;
    }
    .track {
      stroke: var(--cgh-slider-track);
      stroke-opacity: 0.3;
      stroke-width: 24;
      stroke-linecap: round;
    }
    .fill-clear {
      stroke: var(--clear-background-color, transparent);
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
    .handle {
      fill: #fff;
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
    .inactive .fill,
    .inactive .fill-clear {
      opacity: 0;
    }
  `,k([m({type:Number})],y.prototype,"min",2),k([m({type:Number})],y.prototype,"max",2),k([m({type:Number})],y.prototype,"step",2),k([m({type:Number})],y.prototype,"value",2),k([m({type:Number})],y.prototype,"low",2),k([m({type:Number})],y.prototype,"high",2),k([m({type:Number})],y.prototype,"current",2),k([m({type:Boolean})],y.prototype,"dual",2),k([m({type:Boolean,reflect:!0})],y.prototype,"disabled",2),k([m({type:String})],y.prototype,"mode",2),k([m({type:Boolean,reflect:!0})],y.prototype,"inactive",2),k([m({type:String})],y.prototype,"bound",2),k([E()],y.prototype,"_localValue",2),k([E()],y.prototype,"_localLow",2),k([E()],y.prototype,"_localHigh",2),k([E()],y.prototype,"_active",2),y=k([C("cgh-circular-slider")],y);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const q={ATTRIBUTE:1,PROPERTY:3,BOOLEAN_ATTRIBUTE:4},_o=t=>(...e)=>({_$litDirective$:t,values:e});let vo=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,o,i){this._$Ct=e,this._$AM=o,this._$Ci=i}_$AS(e,o){return this.update(e,o)}update(e,o){return this.render(...o)}};/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const yo="important",Ji=" !"+yo,Be=_o(class extends vo{constructor(t){var e;if(super(t),t.type!==q.ATTRIBUTE||t.name!=="style"||((e=t.strings)==null?void 0:e.length)>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(t){return Object.keys(t).reduce((e,o)=>{const i=t[o];return i==null?e:e+`${o=o.includes("-")?o:o.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${i};`},"")}update(t,[e]){const{style:o}=t.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(e)),this.render(e);for(const i of this.ft)e[i]==null&&(this.ft.delete(i),i.includes("-")?o.removeProperty(i):o[i]=null);for(const i in e){const s=e[i];if(s!=null){this.ft.add(i);const a=typeof s=="string"&&s.endsWith(Ji);i.includes("-")||a?o.setProperty(i,a?s.slice(0,-11):s,a?yo:""):o[i]=s}}return M}}),Ne={en:{"action.cooling":"Cooling","action.drying":"Drying","action.fan":"Fan","action.heating":"Heating","action.idle":"Idle","action.off":"Off","block.presence":"Away","block.switch":"Main switch: Off","block.switch_release":"Main switch: Manual control","block.switch_temperature":"Main switch: Temperature","block.window":"Window open","card.entity_not_found":"Entity not found: {entity}","card.more_info":"More info","common.decrease":"Decrease","common.humidity":"Humidity","common.increase":"Increase","common.temperature":"Temperature","demo.group":"Demo group","demo.room.bathroom":"Bathroom","demo.room.bedroom":"Bedroom","demo.room.kitchen":"Kitchen","demo.room.living_room":"Living room","demo.schedule":"Demo schedule","demo.slot":"Demo slot","demo.vacation":"Vacation","editor.battery":"Battery","editor.control.buttons":"−/+ buttons","editor.control.slider":"Slider","editor.control.toggle":"Temperature/humidity switch","editor.controls":"Controls","editor.demo":"Demo mode (synthetic data; no entity needed)","editor.group_entity":"Group entity","editor.main_switch":"Main switch","editor.main_switch_missing":"This entity reports no main switch — only groups with “Advanced Features” turned on have one.","editor.reset":"Reset button","editor.reset_empty":"No option selected — the card shows no reset button.","editor.reset_missing":"This entity offers no reset — only groups with “Advanced Features” turned on do.","editor.section.badges":"Badges","editor.section.deviations":"Deviations","editor.section.panel":"Panel","editor.status_cell":"Status cell","editor.title":"Title","editor.title_placeholder":"Use the entity name","feature.calibration":"Calibration","feature.isolation":"Isolation","feature.presence":"Presence","feature.schedule":"Schedule","feature.sync":"Sync","feature.window":"Window","humidity.target":"Humidity target","main_switch.label":"Main switch","member.low_battery":"Low battery","member.unavailable":"Unavailable","mode.auto":"Auto","mode.cool":"Cool","mode.dry":"Dry","mode.fan_only":"Fan only","mode.heat":"Heat","mode.heat_cool":"Heat/Cool","mode.off":"Off","reset.boost":"Boost","reset.bypass":"Schedule bypass","reset.fallback":"Schedule fallback","reset.label":"Reset","reset.offset":"Temperature offset","reset.presets":"Group presets","reset.schedule":"Schedule","source.manual":"Manual","source.mirror":"Mirror","source.schedule":"Schedule","source.sync":"Sync","source.window":"Window","status.active":"Active","status.blocking_for":"for {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergence","status.hold":"Hold {minutes} min","status.isolated":"{count} isolated","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} with low battery","status.next":"Next {time}","status.no_deviations":"No deviations","status.offset":"Offset {value}","status.oob":"{count} out of bounds","tile.fan":"Fan mode","tile.mode":"Mode","tile.preset":"Preset","tile.swing":"Swing mode","tile.swing_horizontal":"Horizontal swing"},cs:{"action.cooling":"Chlazení","action.drying":"Odvlhčování","action.fan":"Ventilátor","action.heating":"Topení","action.idle":"Nečinný","action.off":"Vypnuto","block.presence":"Nepřítomen","block.switch":"Hlavní vypínač: Vypnuto","block.switch_release":"Hlavní vypínač: Ruční ovládání","block.switch_temperature":"Hlavní vypínač: Teplota","block.window":"Okno otevřeno","card.entity_not_found":"Entita nenalezena: {entity}","card.more_info":"Více informací","common.decrease":"Snížit","common.humidity":"Vlhkost","common.increase":"Zvýšit","common.temperature":"Teplota","demo.group":"Demo skupina","demo.room.bathroom":"Koupelna","demo.room.bedroom":"Ložnice","demo.room.kitchen":"Kuchyně","demo.room.living_room":"Obývací pokoj","demo.schedule":"Demo plán","demo.slot":"Demo úsek","demo.vacation":"Dovolená","editor.battery":"Baterie","editor.control.buttons":"Tlačítka −/+","editor.control.slider":"Posuvník","editor.control.toggle":"Přepínač teplota/vlhkost","editor.controls":"Ovládací prvky","editor.demo":"Režim ukázky (syntetická data; není potřeba entita)","editor.group_entity":"Entita skupiny","editor.main_switch":"Hlavní vypínač","editor.main_switch_missing":"Tato entita nehlásí žádný hlavní vypínač — mají ho jen skupiny se zapnutými „Pokročilé funkce“.","editor.reset":"Tlačítko obnovení","editor.reset_empty":"Není vybrána žádná možnost — karta nezobrazí tlačítko obnovení.","editor.reset_missing":"Tato entita nenabízí žádné obnovení — nabízejí ho jen skupiny se zapnutými „Pokročilé funkce“.","editor.section.badges":"Odznaky","editor.section.deviations":"Odchylky","editor.section.panel":"Panel","editor.status_cell":"Stavová buňka","editor.title":"Název","editor.title_placeholder":"Použít název entity","feature.calibration":"Kalibrace","feature.isolation":"Izolace","feature.presence":"Přítomnost","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cílová vlhkost","main_switch.label":"Hlavní vypínač","member.low_battery":"Slabá baterie","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chlazení","mode.dry":"Odvlhčování","mode.fan_only":"Pouze ventilátor","mode.heat":"Topení","mode.heat_cool":"Topení/Chlazení","mode.off":"Vypnuto","reset.boost":"Boost","reset.bypass":"Obchvat plánu","reset.fallback":"Náhradní plán","reset.label":"Obnovit","reset.offset":"Teplotní offset","reset.presets":"Předvolby skupiny","reset.schedule":"Plán","source.manual":"Ručně","source.mirror":"Zrcadlení","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Aktivní","status.blocking_for":"už {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchylka","status.hold":"Podržet {minutes} min","status.isolated":"{count} izolováno","status.layer_bypass":"Obchvat","status.layer_fallback":"Náhradní","status.low_battery":"{count} se slabou baterií","status.next":"Další {time}","status.no_deviations":"Žádné odchylky","status.offset":"Offset {value}","status.oob":"{count} mimo rozsah","tile.fan":"Režim ventilátoru","tile.mode":"Režim","tile.preset":"Předvolba","tile.swing":"Režim natáčení","tile.swing_horizontal":"Vodorovné natáčení"},da:{"action.cooling":"Køler","action.drying":"Affugter","action.fan":"Ventilator","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Slukket","block.presence":"Ikke hjemme","block.switch":"Hovedafbryder: Slukket","block.switch_release":"Hovedafbryder: Manuel styring","block.switch_temperature":"Hovedafbryder: Temperatur","block.window":"Vindue åbent","card.entity_not_found":"Enhed ikke fundet: {entity}","card.more_info":"Mere info","common.decrease":"Reducér","common.humidity":"Luftfugtighed","common.increase":"Forøg","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.room.bathroom":"Badeværelse","demo.room.bedroom":"Soveværelse","demo.room.kitchen":"Køkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrum","demo.vacation":"Ferie","editor.battery":"Batteri","editor.control.buttons":"−/+-knapper","editor.control.slider":"Skyder","editor.control.toggle":"Skift mellem temperatur/fugtighed","editor.controls":"Betjening","editor.demo":"Demotilstand (syntetiske data; ingen enhed nødvendig)","editor.group_entity":"Gruppeenhed","editor.main_switch":"Hovedafbryder","editor.main_switch_missing":"Denne entitet har ingen hovedafbryder — kun grupper med „Avancerede funktioner“ slået til har en.","editor.reset":"Nulstillingsknap","editor.reset_empty":"Ingen mulighed valgt — kortet viser ingen nulstillingsknap.","editor.reset_missing":"Denne entitet tilbyder ingen nulstilling — kun grupper med „Avancerede funktioner“ slået til gør.","editor.section.badges":"Mærkater","editor.section.deviations":"Afvigelser","editor.section.panel":"Panel","editor.status_cell":"Statusfelt","editor.title":"Titel","editor.title_placeholder":"Brug enhedens navn","feature.calibration":"Kalibrering","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindue","humidity.target":"Ønsket luftfugtighed","main_switch.label":"Hovedafbryder","member.low_battery":"Lavt batteri","member.unavailable":"Utilgængelig","mode.auto":"Automatisk","mode.cool":"Køling","mode.dry":"Affugtning","mode.fan_only":"Kun ventilator","mode.heat":"Varme","mode.heat_cool":"Varme/Køling","mode.off":"Slukket","reset.boost":"Boost","reset.bypass":"Tidsplan-bypass","reset.fallback":"Tidsplan-fallback","reset.label":"Nulstil","reset.offset":"Temperaturforskydning","reset.presets":"Gruppeforudindstillinger","reset.schedule":"Tidsplan","source.manual":"Manuel","source.mirror":"Spejling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindue","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} afvigelse","status.hold":"Hold {minutes} min","status.isolated":"{count} isoleret","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} med lavt batteri","status.next":"Næste {time}","status.no_deviations":"Ingen afvigelser","status.offset":"Offset {value}","status.oob":"{count} uden for området","tile.fan":"Ventilatortilstand","tile.mode":"Tilstand","tile.preset":"Forudindstilling","tile.swing":"Svingtilstand","tile.swing_horizontal":"Vandret sving"},de:{"action.cooling":"Kühlen","action.drying":"Trocknen","action.fan":"Lüfter","action.heating":"Heizen","action.idle":"Bereit","action.off":"Aus","block.presence":"Abwesend","block.switch":"Hauptschalter: Aus","block.switch_release":"Hauptschalter: Handbetrieb","block.switch_temperature":"Hauptschalter: Temperatur","block.window":"Fenster offen","card.entity_not_found":"Entität nicht gefunden: {entity}","card.more_info":"Mehr Infos","common.decrease":"Verringern","common.humidity":"Luftfeuchte","common.increase":"Erhöhen","common.temperature":"Temperatur","demo.group":"Demo-Gruppe","demo.room.bathroom":"Bad","demo.room.bedroom":"Schlafzimmer","demo.room.kitchen":"Küche","demo.room.living_room":"Wohnzimmer","demo.schedule":"Demo-Zeitplan","demo.slot":"Demo-Zeitblock","demo.vacation":"Urlaub","editor.battery":"Batterie","editor.control.buttons":"−/+-Tasten","editor.control.slider":"Schieberegler","editor.control.toggle":"Umschalter Temperatur/Luftfeuchte","editor.controls":"Bedienelemente","editor.demo":"Demo-Modus (synthetische Daten; keine Entität nötig)","editor.group_entity":"Gruppen-Entität","editor.main_switch":"Hauptschalter","editor.main_switch_missing":"Diese Entität meldet keinen Hauptschalter — den haben nur Gruppen, bei denen „Erweiterte Funktionen“ eingeschaltet ist.","editor.reset":"Reset-Schaltfläche","editor.reset_empty":"Keine Option gewählt — die Karte zeigt keine Reset-Schaltfläche.","editor.reset_missing":"Diese Entität bietet kein Zurücksetzen — das können nur Gruppen, bei denen „Erweiterte Funktionen“ eingeschaltet ist.","editor.section.badges":"Badges","editor.section.deviations":"Abweichungen","editor.section.panel":"Panel","editor.status_cell":"Status-Zelle","editor.title":"Titel","editor.title_placeholder":"Entitätsname verwenden","feature.calibration":"Kalibrierung","feature.isolation":"Isolation","feature.presence":"Präsenz","feature.schedule":"Zeitplan","feature.sync":"Sync","feature.window":"Fenster","humidity.target":"Feuchte-Sollwert","main_switch.label":"Hauptschalter","member.low_battery":"Batterie schwach","member.unavailable":"Nicht verfügbar","mode.auto":"Automatik","mode.cool":"Kühlen","mode.dry":"Trocknen","mode.fan_only":"Nur Lüfter","mode.heat":"Heizen","mode.heat_cool":"Heizen/Kühlen","mode.off":"Aus","reset.boost":"Boost","reset.bypass":"Zeitplan-Bypass","reset.fallback":"Zeitplan-Fallback","reset.label":"Zurücksetzen","reset.offset":"Temperatur-Offset","reset.presets":"Gruppen-Presets","reset.schedule":"Zeitplan","source.manual":"Manuell","source.mirror":"Mirror","source.schedule":"Zeitplan","source.sync":"Sync","source.window":"Fenster","status.active":"Aktiv","status.blocking_for":"seit {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} Abweichung","status.hold":"Halten {minutes} min","status.isolated":"{count} isoliert","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} mit schwacher Batterie","status.next":"Nächster {time}","status.no_deviations":"Keine Abweichungen","status.offset":"Offset {value}","status.oob":"{count} außerhalb des Bereichs","tile.fan":"Lüftermodus","tile.mode":"Modus","tile.preset":"Preset","tile.swing":"Schwenkmodus","tile.swing_horizontal":"Horizontal schwenken"},es:{"action.cooling":"Enfriando","action.drying":"Deshumidificando","action.fan":"Ventilador","action.heating":"Calentando","action.idle":"Inactivo","action.off":"Apagado","block.presence":"Ausente","block.switch":"Interruptor principal: Apagado","block.switch_release":"Interruptor principal: Control manual","block.switch_temperature":"Interruptor principal: Temperatura","block.window":"Ventana abierta","card.entity_not_found":"Entidad no encontrada: {entity}","card.more_info":"Más información","common.decrease":"Disminuir","common.humidity":"Humedad","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demostración","demo.room.bathroom":"Baño","demo.room.bedroom":"Dormitorio","demo.room.kitchen":"Cocina","demo.room.living_room":"Salón","demo.schedule":"Programación de demostración","demo.slot":"Franja de demostración","demo.vacation":"Vacaciones","editor.battery":"Batería","editor.control.buttons":"Botones −/+","editor.control.slider":"Control deslizante","editor.control.toggle":"Selector temperatura/humedad","editor.controls":"Controles","editor.demo":"Modo demo (datos sintéticos; no se necesita entidad)","editor.group_entity":"Entidad del grupo","editor.main_switch":"Interruptor principal","editor.main_switch_missing":"Esta entidad no tiene interruptor principal — solo lo tienen los grupos con «Funciones avanzadas» activadas.","editor.reset":"Botón de restablecer","editor.reset_empty":"Ninguna opción seleccionada — la tarjeta no muestra el botón de restablecer.","editor.reset_missing":"Esta entidad no ofrece restablecimiento — solo los grupos con «Funciones avanzadas» activadas lo ofrecen.","editor.section.badges":"Insignias","editor.section.deviations":"Desviaciones","editor.section.panel":"Panel","editor.status_cell":"Celda de estado","editor.title":"Título","editor.title_placeholder":"Usar el nombre de la entidad","feature.calibration":"Calibración","feature.isolation":"Aislamiento","feature.presence":"Presencia","feature.schedule":"Programación","feature.sync":"Sync","feature.window":"Ventana","humidity.target":"Humedad objetivo","main_switch.label":"Interruptor principal","member.low_battery":"Batería baja","member.unavailable":"No disponible","mode.auto":"Automático","mode.cool":"Frío","mode.dry":"Seco","mode.fan_only":"Solo ventilador","mode.heat":"Calor","mode.heat_cool":"Calor/Frío","mode.off":"Apagado","reset.boost":"Boost","reset.bypass":"Anulación de la programación","reset.fallback":"Reserva de la programación","reset.label":"Restablecer","reset.offset":"Desplazamiento de temperatura","reset.presets":"Preajustes de grupo","reset.schedule":"Programación","source.manual":"Manual","source.mirror":"Espejo","source.schedule":"Programación","source.sync":"Sync","source.window":"Ventana","status.active":"Activo","status.blocking_for":"desde hace {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergencia","status.hold":"Mantener {minutes} min","status.isolated":"{count} aislado","status.layer_bypass":"Anulación","status.layer_fallback":"Reserva","status.low_battery":"{count} con batería baja","status.next":"Siguiente {time}","status.no_deviations":"Sin desviaciones","status.offset":"Offset {value}","status.oob":"{count} fuera de rango","tile.fan":"Modo de ventilador","tile.mode":"Modo","tile.preset":"Preajuste","tile.swing":"Modo de oscilación","tile.swing_horizontal":"Oscilación horizontal"},fi:{"action.cooling":"Jäähdyttää","action.drying":"Kuivattaa","action.fan":"Puhallin","action.heating":"Lämmittää","action.idle":"Odottaa","action.off":"Pois","block.presence":"Poissa","block.switch":"Pääkytkin: Pois","block.switch_release":"Pääkytkin: Käsiohjaus","block.switch_temperature":"Pääkytkin: Lämpötila","block.window":"Ikkuna auki","card.entity_not_found":"Entiteettiä ei löytynyt: {entity}","card.more_info":"Lisätietoja","common.decrease":"Vähennä","common.humidity":"Kosteus","common.increase":"Lisää","common.temperature":"Lämpötila","demo.group":"Demoryhmä","demo.room.bathroom":"Kylpyhuone","demo.room.bedroom":"Makuuhuone","demo.room.kitchen":"Keittiö","demo.room.living_room":"Olohuone","demo.schedule":"Demoaikataulu","demo.slot":"Demojakso","demo.vacation":"Loma","editor.battery":"Akku","editor.control.buttons":"−/+-painikkeet","editor.control.slider":"Liukusäädin","editor.control.toggle":"Lämpötila/kosteus-valitsin","editor.controls":"Säätimet","editor.demo":"Esittelytila (synteettinen data; entiteettiä ei tarvita)","editor.group_entity":"Ryhmän entiteetti","editor.main_switch":"Pääkytkin","editor.main_switch_missing":"Tällä entiteetillä ei ole pääkytkintä — se on vain ryhmillä, joissa ”Lisäominaisuudet” on käytössä.","editor.reset":"Palautuspainike","editor.reset_empty":"Mitään vaihtoehtoa ei ole valittu — kortti ei näytä palautuspainiketta.","editor.reset_missing":"Tämä entiteetti ei tarjoa palautusta — vain ryhmät, joissa ”Lisäominaisuudet” on käytössä, tarjoavat sen.","editor.section.badges":"Merkit","editor.section.deviations":"Poikkeamat","editor.section.panel":"Paneeli","editor.status_cell":"Tilaruutu","editor.title":"Otsikko","editor.title_placeholder":"Käytä entiteetin nimeä","feature.calibration":"Kalibrointi","feature.isolation":"Eristys","feature.presence":"Läsnäolo","feature.schedule":"Aikataulu","feature.sync":"Sync","feature.window":"Ikkuna","humidity.target":"Kosteuden tavoite","main_switch.label":"Pääkytkin","member.low_battery":"Akku vähissä","member.unavailable":"Ei saatavilla","mode.auto":"Automaattinen","mode.cool":"Jäähdytys","mode.dry":"Kuivaus","mode.fan_only":"Vain puhallin","mode.heat":"Lämmitys","mode.heat_cool":"Lämmitys/Jäähdytys","mode.off":"Pois","reset.boost":"Boost","reset.bypass":"Aikataulun ohitus","reset.fallback":"Aikataulun varatila","reset.label":"Palauta","reset.offset":"Lämpötilan siirtymä","reset.presets":"Ryhmän esiasetukset","reset.schedule":"Aikataulu","source.manual":"Manuaalinen","source.mirror":"Peilaus","source.schedule":"Aikataulu","source.sync":"Sync","source.window":"Ikkuna","status.active":"Aktiivinen","status.blocking_for":"jo {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} poikkeama","status.hold":"Pito {minutes} min","status.isolated":"{count} eristetty","status.layer_bypass":"Ohitus","status.layer_fallback":"Varatila","status.low_battery":"Akku vähissä: {count}","status.next":"Seuraava {time}","status.no_deviations":"Ei poikkeamia","status.offset":"Siirtymä {value}","status.oob":"{count} rajojen ulkopuolella","tile.fan":"Puhallintila","tile.mode":"Tila","tile.preset":"Esiasetus","tile.swing":"Kääntötila","tile.swing_horizontal":"Vaakakääntö"},fr:{"action.cooling":"Refroidissement","action.drying":"Déshumidification","action.fan":"Ventilation","action.heating":"Chauffage","action.idle":"Inactif","action.off":"Éteint","block.presence":"Absent","block.switch":"Interrupteur principal : Éteint","block.switch_release":"Interrupteur principal : Contrôle manuel","block.switch_temperature":"Interrupteur principal : Température","block.window":"Fenêtre ouverte","card.entity_not_found":"Entité introuvable : {entity}","card.more_info":"Plus d'infos","common.decrease":"Diminuer","common.humidity":"Humidité","common.increase":"Augmenter","common.temperature":"Température","demo.group":"Groupe de démo","demo.room.bathroom":"Salle de bain","demo.room.bedroom":"Chambre","demo.room.kitchen":"Cuisine","demo.room.living_room":"Salon","demo.schedule":"Planification de démo","demo.slot":"Créneau de démo","demo.vacation":"Vacances","editor.battery":"Batterie","editor.control.buttons":"Boutons −/+","editor.control.slider":"Curseur","editor.control.toggle":"Bascule température/humidité","editor.controls":"Commandes","editor.demo":"Mode démo (données synthétiques ; aucune entité requise)","editor.group_entity":"Entité du groupe","editor.main_switch":"Interrupteur principal","editor.main_switch_missing":"Cette entité n’a pas d’interrupteur principal — seuls les groupes avec « Fonctions avancées » activées en ont un.","editor.reset":"Bouton de réinitialisation","editor.reset_empty":"Aucune option sélectionnée — la carte n’affiche pas de bouton de réinitialisation.","editor.reset_missing":"Cette entité ne propose pas de réinitialisation — seuls les groupes avec « Fonctions avancées » activées le font.","editor.section.badges":"Badges","editor.section.deviations":"Écarts","editor.section.panel":"Panneau","editor.status_cell":"Cellule d'état","editor.title":"Titre","editor.title_placeholder":"Utiliser le nom de l'entité","feature.calibration":"Calibration","feature.isolation":"Isolation","feature.presence":"Présence","feature.schedule":"Planification","feature.sync":"Sync","feature.window":"Fenêtre","humidity.target":"Humidité cible","main_switch.label":"Interrupteur principal","member.low_battery":"Batterie faible","member.unavailable":"Indisponible","mode.auto":"Automatique","mode.cool":"Froid","mode.dry":"Sec","mode.fan_only":"Ventilation seule","mode.heat":"Chauffage","mode.heat_cool":"Chauffage/Froid","mode.off":"Éteint","reset.boost":"Boost","reset.bypass":"Contournement de la planification","reset.fallback":"Secours de la planification","reset.label":"Réinitialiser","reset.offset":"Décalage de température","reset.presets":"Préréglages de groupe","reset.schedule":"Planification","source.manual":"Manuel","source.mirror":"Miroir","source.schedule":"Planification","source.sync":"Sync","source.window":"Fenêtre","status.active":"Actif","status.blocking_for":"depuis {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} écart","status.hold":"Maintien {minutes} min","status.isolated":"{count} isolé","status.layer_bypass":"Contournement","status.layer_fallback":"Secours","status.low_battery":"{count} avec batterie faible","status.next":"Prochain {time}","status.no_deviations":"Aucun écart","status.offset":"Décalage {value}","status.oob":"{count} hors limites","tile.fan":"Mode ventilation","tile.mode":"Mode","tile.preset":"Préréglage","tile.swing":"Mode oscillation","tile.swing_horizontal":"Oscillation horizontale"},it:{"action.cooling":"Raffreddamento","action.drying":"Deumidificazione","action.fan":"Ventola","action.heating":"Riscaldamento","action.idle":"Inattivo","action.off":"Spento","block.presence":"Assente","block.switch":"Interruttore principale: Spento","block.switch_release":"Interruttore principale: Controllo manuale","block.switch_temperature":"Interruttore principale: Temperatura","block.window":"Finestra aperta","card.entity_not_found":"Entità non trovata: {entity}","card.more_info":"Altre info","common.decrease":"Diminuisci","common.humidity":"Umidità","common.increase":"Aumenta","common.temperature":"Temperatura","demo.group":"Gruppo demo","demo.room.bathroom":"Bagno","demo.room.bedroom":"Camera da letto","demo.room.kitchen":"Cucina","demo.room.living_room":"Soggiorno","demo.schedule":"Pianificazione demo","demo.slot":"Fascia demo","demo.vacation":"Vacanza","editor.battery":"Batteria","editor.control.buttons":"Pulsanti −/+","editor.control.slider":"Cursore","editor.control.toggle":"Selettore temperatura/umidità","editor.controls":"Controlli","editor.demo":"Modalità demo (dati sintetici; nessuna entità necessaria)","editor.group_entity":"Entità del gruppo","editor.main_switch":"Interruttore principale","editor.main_switch_missing":"Questa entità non ha un interruttore principale — ce l’hanno solo i gruppi con «Funzioni avanzate» attive.","editor.reset":"Pulsante di ripristino","editor.reset_empty":"Nessuna opzione selezionata — la scheda non mostra il pulsante di ripristino.","editor.reset_missing":"Questa entità non offre il ripristino — lo offrono solo i gruppi con «Funzioni avanzate» attive.","editor.section.badges":"Badge","editor.section.deviations":"Scostamenti","editor.section.panel":"Pannello","editor.status_cell":"Cella di stato","editor.title":"Titolo","editor.title_placeholder":"Usa il nome dell'entità","feature.calibration":"Calibrazione","feature.isolation":"Isolamento","feature.presence":"Presenza","feature.schedule":"Pianificazione","feature.sync":"Sync","feature.window":"Finestra","humidity.target":"Umidità target","main_switch.label":"Interruttore principale","member.low_battery":"Batteria scarica","member.unavailable":"Non disponibile","mode.auto":"Automatico","mode.cool":"Raffreddamento","mode.dry":"Deumidificazione","mode.fan_only":"Solo ventola","mode.heat":"Riscaldamento","mode.heat_cool":"Riscaldamento/Raffreddamento","mode.off":"Spento","reset.boost":"Boost","reset.bypass":"Bypass della pianificazione","reset.fallback":"Riserva della pianificazione","reset.label":"Ripristina","reset.offset":"Offset temperatura","reset.presets":"Preimpostazioni di gruppo","reset.schedule":"Pianificazione","source.manual":"Manuale","source.mirror":"Mirror","source.schedule":"Pianificazione","source.sync":"Sync","source.window":"Finestra","status.active":"Attivo","status.blocking_for":"da {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} scostamento","status.hold":"Mantieni {minutes} min","status.isolated":"{count} isolato","status.layer_bypass":"Bypass","status.layer_fallback":"Riserva","status.low_battery":"{count} con batteria scarica","status.next":"Prossimo {time}","status.no_deviations":"Nessuno scostamento","status.offset":"Offset {value}","status.oob":"{count} fuori intervallo","tile.fan":"Modalità ventola","tile.mode":"Modalità","tile.preset":"Preset","tile.swing":"Modalità oscillazione","tile.swing_horizontal":"Oscillazione orizzontale"},nb:{"action.cooling":"Kjøler","action.drying":"Avfukter","action.fan":"Vifte","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borte","block.switch":"Hovedbryter: Av","block.switch_release":"Hovedbryter: Manuell styring","block.switch_temperature":"Hovedbryter: Temperatur","block.window":"Vindu åpent","card.entity_not_found":"Enhet ikke funnet: {entity}","card.more_info":"Mer info","common.decrease":"Reduser","common.humidity":"Luftfuktighet","common.increase":"Øk","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.room.bathroom":"Bad","demo.room.bedroom":"Soverom","demo.room.kitchen":"Kjøkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrom","demo.vacation":"Ferie","editor.battery":"Batteri","editor.control.buttons":"−/+-knapper","editor.control.slider":"Glidebryter","editor.control.toggle":"Bryter temperatur/fuktighet","editor.controls":"Kontroller","editor.demo":"Demomodus (syntetiske data; ingen enhet nødvendig)","editor.group_entity":"Gruppeenhet","editor.main_switch":"Hovedbryter","editor.main_switch_missing":"Denne entiteten har ingen hovedbryter — bare grupper med «Avanserte funksjoner» slått på har en.","editor.reset":"Tilbakestillingsknapp","editor.reset_empty":"Ingen valg er gjort — kortet viser ingen tilbakestillingsknapp.","editor.reset_missing":"Denne entiteten tilbyr ingen tilbakestilling — bare grupper med «Avanserte funksjoner» slått på gjør det.","editor.section.badges":"Merker","editor.section.deviations":"Avvik","editor.section.panel":"Panel","editor.status_cell":"Statusfelt","editor.title":"Tittel","editor.title_placeholder":"Bruk enhetsnavnet","feature.calibration":"Kalibrering","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindu","humidity.target":"Ønsket luftfuktighet","main_switch.label":"Hovedbryter","member.low_battery":"Lavt batteri","member.unavailable":"Utilgjengelig","mode.auto":"Automatisk","mode.cool":"Kjøling","mode.dry":"Avfukting","mode.fan_only":"Kun vifte","mode.heat":"Varme","mode.heat_cool":"Varme/Kjøling","mode.off":"Av","reset.boost":"Boost","reset.bypass":"Omgåelse av tidsplan","reset.fallback":"Reserve for tidsplan","reset.label":"Tilbakestill","reset.offset":"Temperaturforskyvning","reset.presets":"Gruppeforhåndsinnstillinger","reset.schedule":"Tidsplan","source.manual":"Manuell","source.mirror":"Speiling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindu","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} avvik","status.hold":"Hold {minutes} min","status.isolated":"{count} isolert","status.layer_bypass":"Omgåelse","status.layer_fallback":"Reserve","status.low_battery":"{count} med lavt batteri","status.next":"Neste {time}","status.no_deviations":"Ingen avvik","status.offset":"Offset {value}","status.oob":"{count} utenfor området","tile.fan":"Viftemodus","tile.mode":"Modus","tile.preset":"Forhåndsinnstilling","tile.swing":"Svingmodus","tile.swing_horizontal":"Horisontal sving"},nl:{"action.cooling":"Koelen","action.drying":"Ontvochtigen","action.fan":"Ventilator","action.heating":"Verwarmen","action.idle":"Inactief","action.off":"Uit","block.presence":"Afwezig","block.switch":"Hoofdschakelaar: Uit","block.switch_release":"Hoofdschakelaar: Handmatige bediening","block.switch_temperature":"Hoofdschakelaar: Temperatuur","block.window":"Raam open","card.entity_not_found":"Entiteit niet gevonden: {entity}","card.more_info":"Meer info","common.decrease":"Verlagen","common.humidity":"Luchtvochtigheid","common.increase":"Verhogen","common.temperature":"Temperatuur","demo.group":"Demogroep","demo.room.bathroom":"Badkamer","demo.room.bedroom":"Slaapkamer","demo.room.kitchen":"Keuken","demo.room.living_room":"Woonkamer","demo.schedule":"Demoschema","demo.slot":"Demoblok","demo.vacation":"Vakantie","editor.battery":"Batterij","editor.control.buttons":"−/+-knoppen","editor.control.slider":"Schuifregelaar","editor.control.toggle":"Schakelaar temperatuur/vochtigheid","editor.controls":"Bediening","editor.demo":"Demomodus (synthetische gegevens; geen entiteit nodig)","editor.group_entity":"Groepsentiteit","editor.main_switch":"Hoofdschakelaar","editor.main_switch_missing":"Deze entiteit heeft geen hoofdschakelaar — alleen groepen met „Geavanceerde functies” ingeschakeld hebben er een.","editor.reset":"Resetknop","editor.reset_empty":"Geen optie gekozen — de kaart toont geen resetknop.","editor.reset_missing":"Deze entiteit biedt geen reset — alleen groepen met „Geavanceerde functies” ingeschakeld doen dat.","editor.section.badges":"Badges","editor.section.deviations":"Afwijkingen","editor.section.panel":"Paneel","editor.status_cell":"Statuscel","editor.title":"Titel","editor.title_placeholder":"Entiteitsnaam gebruiken","feature.calibration":"Kalibratie","feature.isolation":"Isolatie","feature.presence":"Aanwezigheid","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Raam","humidity.target":"Gewenste luchtvochtigheid","main_switch.label":"Hoofdschakelaar","member.low_battery":"Batterij bijna leeg","member.unavailable":"Niet beschikbaar","mode.auto":"Automatisch","mode.cool":"Koelen","mode.dry":"Drogen","mode.fan_only":"Alleen ventilator","mode.heat":"Verwarmen","mode.heat_cool":"Verwarmen/Koelen","mode.off":"Uit","reset.boost":"Boost","reset.bypass":"Schema-bypass","reset.fallback":"Schema-terugval","reset.label":"Resetten","reset.offset":"Temperatuuroffset","reset.presets":"Groepsvoorinstellingen","reset.schedule":"Schema","source.manual":"Handmatig","source.mirror":"Spiegel","source.schedule":"Schema","source.sync":"Sync","source.window":"Raam","status.active":"Actief","status.blocking_for":"al {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} afwijking","status.hold":"Vasthouden {minutes} min","status.isolated":"{count} geïsoleerd","status.layer_bypass":"Bypass","status.layer_fallback":"Terugval","status.low_battery":"{count} met bijna lege batterij","status.next":"Volgende {time}","status.no_deviations":"Geen afwijkingen","status.offset":"Offset {value}","status.oob":"{count} buiten bereik","tile.fan":"Ventilatormodus","tile.mode":"Modus","tile.preset":"Voorinstelling","tile.swing":"Zwenkmodus","tile.swing_horizontal":"Horizontaal zwenken"},pl:{"action.cooling":"Chłodzenie","action.drying":"Osuszanie","action.fan":"Wentylator","action.heating":"Ogrzewanie","action.idle":"Bezczynny","action.off":"Wyłączony","block.presence":"Nieobecny","block.switch":"Wyłącznik główny: Wyłączony","block.switch_release":"Wyłącznik główny: Sterowanie ręczne","block.switch_temperature":"Wyłącznik główny: Temperatura","block.window":"Okno otwarte","card.entity_not_found":"Nie znaleziono encji: {entity}","card.more_info":"Więcej informacji","common.decrease":"Zmniejsz","common.humidity":"Wilgotność","common.increase":"Zwiększ","common.temperature":"Temperatura","demo.group":"Grupa demonstracyjna","demo.room.bathroom":"Łazienka","demo.room.bedroom":"Sypialnia","demo.room.kitchen":"Kuchnia","demo.room.living_room":"Salon","demo.schedule":"Harmonogram demonstracyjny","demo.slot":"Przedział demonstracyjny","demo.vacation":"Urlop","editor.battery":"Bateria","editor.control.buttons":"Przyciski −/+","editor.control.slider":"Suwak","editor.control.toggle":"Przełącznik temperatura/wilgotność","editor.controls":"Elementy sterujące","editor.demo":"Tryb demo (dane syntetyczne; encja nie jest potrzebna)","editor.group_entity":"Encja grupy","editor.main_switch":"Wyłącznik główny","editor.main_switch_missing":"Ta encja nie zgłasza wyłącznika głównego — mają go tylko grupy z włączonymi „Funkcje zaawansowane”.","editor.reset":"Przycisk resetu","editor.reset_empty":"Nie wybrano żadnej opcji — karta nie pokazuje przycisku resetu.","editor.reset_missing":"Ta encja nie oferuje resetu — oferują go tylko grupy z włączonymi „Funkcje zaawansowane”.","editor.section.badges":"Odznaki","editor.section.deviations":"Odchylenia","editor.section.panel":"Panel","editor.status_cell":"Komórka stanu","editor.title":"Tytuł","editor.title_placeholder":"Użyj nazwy encji","feature.calibration":"Kalibracja","feature.isolation":"Izolacja","feature.presence":"Obecność","feature.schedule":"Harmonogram","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Docelowa wilgotność","main_switch.label":"Wyłącznik główny","member.low_battery":"Słaba bateria","member.unavailable":"Niedostępny","mode.auto":"Automatyczny","mode.cool":"Chłodzenie","mode.dry":"Osuszanie","mode.fan_only":"Tylko wentylator","mode.heat":"Ogrzewanie","mode.heat_cool":"Ogrzewanie/Chłodzenie","mode.off":"Wyłączony","reset.boost":"Boost","reset.bypass":"Obejście harmonogramu","reset.fallback":"Zapas harmonogramu","reset.label":"Resetuj","reset.offset":"Przesunięcie temperatury","reset.presets":"Profile grupy","reset.schedule":"Harmonogram","source.manual":"Ręcznie","source.mirror":"Lustro","source.schedule":"Harmonogram","source.sync":"Sync","source.window":"Okno","status.active":"Aktywny","status.blocking_for":"od {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchylenie","status.hold":"Wstrzymanie {minutes} min","status.isolated":"{count} izolowanych","status.layer_bypass":"Obejście","status.layer_fallback":"Zapas","status.low_battery":"{count} ze słabą baterią","status.next":"Następny {time}","status.no_deviations":"Brak odchyleń","status.offset":"Przesunięcie {value}","status.oob":"{count} poza zakresem","tile.fan":"Tryb wentylatora","tile.mode":"Tryb","tile.preset":"Ustawienie wstępne","tile.swing":"Tryb wahania","tile.swing_horizontal":"Wahanie poziome"},pt:{"action.cooling":"A arrefecer","action.drying":"A desumidificar","action.fan":"Ventilação","action.heating":"A aquecer","action.idle":"Inativo","action.off":"Desligado","block.presence":"Ausente","block.switch":"Interruptor principal: Desligado","block.switch_release":"Interruptor principal: Controlo manual","block.switch_temperature":"Interruptor principal: Temperatura","block.window":"Janela aberta","card.entity_not_found":"Entidade não encontrada: {entity}","card.more_info":"Mais informações","common.decrease":"Diminuir","common.humidity":"Humidade","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demonstração","demo.room.bathroom":"Casa de banho","demo.room.bedroom":"Quarto","demo.room.kitchen":"Cozinha","demo.room.living_room":"Sala de estar","demo.schedule":"Agendamento de demonstração","demo.slot":"Intervalo de demonstração","demo.vacation":"Férias","editor.battery":"Bateria","editor.control.buttons":"Botões −/+","editor.control.slider":"Controlo deslizante","editor.control.toggle":"Seletor temperatura/humidade","editor.controls":"Controlos","editor.demo":"Modo demo (dados sintéticos; não é necessária uma entidade)","editor.group_entity":"Entidade do grupo","editor.main_switch":"Interruptor principal","editor.main_switch_missing":"Esta entidade não tem interruptor principal — só os grupos com «Funcionalidades avançadas» ativadas têm um.","editor.reset":"Botão de repor","editor.reset_empty":"Nenhuma opção selecionada — o cartão não mostra o botão de repor.","editor.reset_missing":"Esta entidade não oferece reposição — só os grupos com «Funcionalidades avançadas» ativadas a oferecem.","editor.section.badges":"Emblemas","editor.section.deviations":"Desvios","editor.section.panel":"Painel","editor.status_cell":"Célula de estado","editor.title":"Título","editor.title_placeholder":"Usar o nome da entidade","feature.calibration":"Calibração","feature.isolation":"Isolamento","feature.presence":"Presença","feature.schedule":"Agendamento","feature.sync":"Sync","feature.window":"Janela","humidity.target":"Humidade alvo","main_switch.label":"Interruptor principal","member.low_battery":"Bateria fraca","member.unavailable":"Indisponível","mode.auto":"Automático","mode.cool":"Arrefecimento","mode.dry":"Desumidificação","mode.fan_only":"Apenas ventilação","mode.heat":"Aquecimento","mode.heat_cool":"Aquecimento/Arrefecimento","mode.off":"Desligado","reset.boost":"Boost","reset.bypass":"Substituição do agendamento","reset.fallback":"Reserva do agendamento","reset.label":"Repor","reset.offset":"Desvio de temperatura","reset.presets":"Predefinições de grupo","reset.schedule":"Agendamento","source.manual":"Manual","source.mirror":"Espelho","source.schedule":"Agendamento","source.sync":"Sync","source.window":"Janela","status.active":"Ativo","status.blocking_for":"há {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergência","status.hold":"Manter {minutes} min","status.isolated":"{count} isolado","status.layer_bypass":"Substituição","status.layer_fallback":"Reserva","status.low_battery":"{count} com bateria fraca","status.next":"Seguinte {time}","status.no_deviations":"Sem desvios","status.offset":"Desvio {value}","status.oob":"{count} fora do intervalo","tile.fan":"Modo de ventilação","tile.mode":"Modo","tile.preset":"Predefinição","tile.swing":"Modo de oscilação","tile.swing_horizontal":"Oscilação horizontal"},sk:{"action.cooling":"Chladenie","action.drying":"Odvlhčovanie","action.fan":"Ventilátor","action.heating":"Kúrenie","action.idle":"Nečinný","action.off":"Vypnuté","block.presence":"Neprítomný","block.switch":"Hlavný vypínač: Vypnuté","block.switch_release":"Hlavný vypínač: Ručné ovládanie","block.switch_temperature":"Hlavný vypínač: Teplota","block.window":"Okno otvorené","card.entity_not_found":"Entita sa nenašla: {entity}","card.more_info":"Viac informácií","common.decrease":"Znížiť","common.humidity":"Vlhkosť","common.increase":"Zvýšiť","common.temperature":"Teplota","demo.group":"Demo skupina","demo.room.bathroom":"Kúpeľňa","demo.room.bedroom":"Spálňa","demo.room.kitchen":"Kuchyňa","demo.room.living_room":"Obývačka","demo.schedule":"Demo plán","demo.slot":"Demo úsek","demo.vacation":"Dovolenka","editor.battery":"Batéria","editor.control.buttons":"Tlačidlá −/+","editor.control.slider":"Posuvník","editor.control.toggle":"Prepínač teplota/vlhkosť","editor.controls":"Ovládacie prvky","editor.demo":"Režim ukážky (syntetické údaje; entita nie je potrebná)","editor.group_entity":"Entita skupiny","editor.main_switch":"Hlavný vypínač","editor.main_switch_missing":"Táto entita nehlási žiadny hlavný vypínač — majú ho len skupiny so zapnutými „Pokročilé funkcie“.","editor.reset":"Tlačidlo obnovenia","editor.reset_empty":"Nie je vybraná žiadna možnosť — karta nezobrazí tlačidlo obnovenia.","editor.reset_missing":"Táto entita neponúka obnovenie — ponúkajú ho len skupiny so zapnutými „Pokročilé funkcie“.","editor.section.badges":"Odznaky","editor.section.deviations":"Odchýlky","editor.section.panel":"Panel","editor.status_cell":"Stavová bunka","editor.title":"Názov","editor.title_placeholder":"Použiť názov entity","feature.calibration":"Kalibrácia","feature.isolation":"Izolácia","feature.presence":"Prítomnosť","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cieľová vlhkosť","main_switch.label":"Hlavný vypínač","member.low_battery":"Slabá batéria","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chladenie","mode.dry":"Odvlhčovanie","mode.fan_only":"Iba ventilátor","mode.heat":"Kúrenie","mode.heat_cool":"Kúrenie/Chladenie","mode.off":"Vypnuté","reset.boost":"Boost","reset.bypass":"Obchádzka plánu","reset.fallback":"Náhradný plán","reset.label":"Obnoviť","reset.offset":"Teplotný offset","reset.presets":"Predvoľby skupiny","reset.schedule":"Plán","source.manual":"Ručne","source.mirror":"Zrkadlenie","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Aktívny","status.blocking_for":"už {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchýlka","status.hold":"Podržať {minutes} min","status.isolated":"{count} izolovaných","status.layer_bypass":"Obchádzka","status.layer_fallback":"Náhradný","status.low_battery":"{count} so slabou batériou","status.next":"Ďalší {time}","status.no_deviations":"Žiadne odchýlky","status.offset":"Offset {value}","status.oob":"{count} mimo rozsahu","tile.fan":"Režim ventilátora","tile.mode":"Režim","tile.preset":"Predvoľba","tile.swing":"Režim natáčania","tile.swing_horizontal":"Vodorovné natáčanie"},sv:{"action.cooling":"Kyler","action.drying":"Avfuktar","action.fan":"Fläkt","action.heating":"Värmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borta","block.switch":"Huvudbrytare: Av","block.switch_release":"Huvudbrytare: Manuell styrning","block.switch_temperature":"Huvudbrytare: Temperatur","block.window":"Fönster öppet","card.entity_not_found":"Entitet hittades inte: {entity}","card.more_info":"Mer info","common.decrease":"Minska","common.humidity":"Luftfuktighet","common.increase":"Öka","common.temperature":"Temperatur","demo.group":"Demogrupp","demo.room.bathroom":"Badrum","demo.room.bedroom":"Sovrum","demo.room.kitchen":"Kök","demo.room.living_room":"Vardagsrum","demo.schedule":"Demoschema","demo.slot":"Demopass","demo.vacation":"Semester","editor.battery":"Batteri","editor.control.buttons":"−/+-knappar","editor.control.slider":"Reglage","editor.control.toggle":"Växla temperatur/luftfuktighet","editor.controls":"Kontroller","editor.demo":"Demoläge (syntetiska data; ingen entitet behövs)","editor.group_entity":"Gruppentitet","editor.main_switch":"Huvudbrytare","editor.main_switch_missing":"Den här entiteten har ingen huvudbrytare — bara grupper med ”Avancerade funktioner” påslaget har en.","editor.reset":"Återställningsknapp","editor.reset_empty":"Inget alternativ valt — kortet visar ingen återställningsknapp.","editor.reset_missing":"Den här entiteten erbjuder ingen återställning — bara grupper med ”Avancerade funktioner” påslaget gör det.","editor.section.badges":"Märken","editor.section.deviations":"Avvikelser","editor.section.panel":"Panel","editor.status_cell":"Statusruta","editor.title":"Titel","editor.title_placeholder":"Använd entitetens namn","feature.calibration":"Kalibrering","feature.isolation":"Isolering","feature.presence":"Närvaro","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Fönster","humidity.target":"Önskad luftfuktighet","main_switch.label":"Huvudbrytare","member.low_battery":"Låg batterinivå","member.unavailable":"Otillgänglig","mode.auto":"Automatiskt","mode.cool":"Kyla","mode.dry":"Avfuktning","mode.fan_only":"Endast fläkt","mode.heat":"Värme","mode.heat_cool":"Värme/Kyla","mode.off":"Av","reset.boost":"Boost","reset.bypass":"Schema-bypass","reset.fallback":"Schemareserv","reset.label":"Återställ","reset.offset":"Temperaturförskjutning","reset.presets":"Gruppförinställningar","reset.schedule":"Schema","source.manual":"Manuell","source.mirror":"Spegling","source.schedule":"Schema","source.sync":"Sync","source.window":"Fönster","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} avvikelse","status.hold":"Håll {minutes} min","status.isolated":"{count} isolerad","status.layer_bypass":"Bypass","status.layer_fallback":"Reserv","status.low_battery":"{count} med låg batterinivå","status.next":"Nästa {time}","status.no_deviations":"Inga avvikelser","status.offset":"Offset {value}","status.oob":"{count} utanför intervallet","tile.fan":"Fläktläge","tile.mode":"Läge","tile.preset":"Förinställning","tile.swing":"Svängläge","tile.swing_horizontal":"Horisontell sväng"},tr:{"action.cooling":"Soğutuyor","action.drying":"Nem alıyor","action.fan":"Fan","action.heating":"Isıtıyor","action.idle":"Boşta","action.off":"Kapalı","block.presence":"Dışarıda","block.switch":"Ana şalter: Kapalı","block.switch_release":"Ana şalter: Manuel kontrol","block.switch_temperature":"Ana şalter: Sıcaklık","block.window":"Pencere açık","card.entity_not_found":"Varlık bulunamadı: {entity}","card.more_info":"Daha fazla bilgi","common.decrease":"Azalt","common.humidity":"Nem","common.increase":"Artır","common.temperature":"Sıcaklık","demo.group":"Demo grubu","demo.room.bathroom":"Banyo","demo.room.bedroom":"Yatak odası","demo.room.kitchen":"Mutfak","demo.room.living_room":"Oturma odası","demo.schedule":"Demo zamanlaması","demo.slot":"Demo zaman dilimi","demo.vacation":"Tatil","editor.battery":"Pil","editor.control.buttons":"−/+ düğmeleri","editor.control.slider":"Kaydırıcı","editor.control.toggle":"Sıcaklık/nem geçişi","editor.controls":"Kontroller","editor.demo":"Demo modu (sentetik veri; varlık gerekmez)","editor.group_entity":"Grup varlığı","editor.main_switch":"Ana şalter","editor.main_switch_missing":"Bu varlık ana şalter bildirmiyor — yalnızca “Gelişmiş Özellikler” açık olan grupların ana şalteri vardır.","editor.reset":"Sıfırlama düğmesi","editor.reset_empty":"Hiçbir seçenek seçilmedi — kart sıfırlama düğmesi göstermez.","editor.reset_missing":"Bu varlık sıfırlama sunmuyor — yalnızca “Gelişmiş Özellikler” açık olan gruplar sunar.","editor.section.badges":"Rozetler","editor.section.deviations":"Sapmalar","editor.section.panel":"Panel","editor.status_cell":"Durum hücresi","editor.title":"Başlık","editor.title_placeholder":"Varlık adını kullan","feature.calibration":"Kalibrasyon","feature.isolation":"İzolasyon","feature.presence":"Varlık algılama","feature.schedule":"Zamanlama","feature.sync":"Sync","feature.window":"Pencere","humidity.target":"Hedef nem","main_switch.label":"Ana şalter","member.low_battery":"Pil zayıf","member.unavailable":"Kullanılamıyor","mode.auto":"Otomatik","mode.cool":"Soğutma","mode.dry":"Nem alma","mode.fan_only":"Yalnızca fan","mode.heat":"Isıtma","mode.heat_cool":"Isıtma/Soğutma","mode.off":"Kapalı","reset.boost":"Boost","reset.bypass":"Zamanlama bypass","reset.fallback":"Zamanlama yedeği","reset.label":"Sıfırla","reset.offset":"Sıcaklık ofseti","reset.presets":"Grup ön ayarları","reset.schedule":"Zamanlama","source.manual":"Manuel","source.mirror":"Yansıtma","source.schedule":"Zamanlama","source.sync":"Sync","source.window":"Pencere","status.active":"Etkin","status.blocking_for":"{duration} beri","status.boost":"Boost {minutes} dk","status.divergence":"{count} sapma","status.hold":"Beklet {minutes} dk","status.isolated":"{count} izole","status.layer_bypass":"Bypass","status.layer_fallback":"Yedek","status.low_battery":"{count} cihazda pil zayıf","status.next":"Sonraki {time}","status.no_deviations":"Sapma yok","status.offset":"Ofset {value}","status.oob":"{count} aralık dışında","tile.fan":"Fan modu","tile.mode":"Mod","tile.preset":"Ön ayar","tile.swing":"Salınım modu","tile.swing_horizontal":"Yatay salınım"},uk:{"action.cooling":"Охолодження","action.drying":"Осушення","action.fan":"Вентилятор","action.heating":"Нагрівання","action.idle":"Очікування","action.off":"Вимкнено","block.presence":"Відсутній","block.switch":"Головний вимикач: Вимкнено","block.switch_release":"Головний вимикач: Ручне керування","block.switch_temperature":"Головний вимикач: Температура","block.window":"Вікно відкрите","card.entity_not_found":"Сутність не знайдено: {entity}","card.more_info":"Докладніше","common.decrease":"Зменшити","common.humidity":"Вологість","common.increase":"Збільшити","common.temperature":"Температура","demo.group":"Демо-група","demo.room.bathroom":"Ванна кімната","demo.room.bedroom":"Спальня","demo.room.kitchen":"Кухня","demo.room.living_room":"Вітальня","demo.schedule":"Демо-розклад","demo.slot":"Демо-інтервал","demo.vacation":"Відпустка","editor.battery":"Батарея","editor.control.buttons":"Кнопки −/+","editor.control.slider":"Повзунок","editor.control.toggle":"Перемикач температура/вологість","editor.controls":"Елементи керування","editor.demo":"Демо-режим (синтетичні дані; сутність не потрібна)","editor.group_entity":"Сутність групи","editor.main_switch":"Головний вимикач","editor.main_switch_missing":"Ця сутність не має головного вимикача — він є лише в груп з увімкненими «Розширені функції».","editor.reset":"Кнопка скидання","editor.reset_empty":"Не вибрано жодного параметра — картка не показує кнопку скидання.","editor.reset_missing":"Ця сутність не пропонує скидання — його пропонують лише групи з увімкненими «Розширені функції».","editor.section.badges":"Значки","editor.section.deviations":"Відхилення","editor.section.panel":"Панель","editor.status_cell":"Комірка стану","editor.title":"Заголовок","editor.title_placeholder":"Використати назву сутності","feature.calibration":"Калібрування","feature.isolation":"Ізоляція","feature.presence":"Присутність","feature.schedule":"Розклад","feature.sync":"Sync","feature.window":"Вікно","humidity.target":"Цільова вологість","main_switch.label":"Головний вимикач","member.low_battery":"Низький заряд батареї","member.unavailable":"Недоступно","mode.auto":"Автоматично","mode.cool":"Охолодження","mode.dry":"Осушення","mode.fan_only":"Лише вентилятор","mode.heat":"Нагрівання","mode.heat_cool":"Нагрівання/Охолодження","mode.off":"Вимкнено","reset.boost":"Boost","reset.bypass":"Обхід розкладу","reset.fallback":"Резерв розкладу","reset.label":"Скинути","reset.offset":"Зміщення температури","reset.presets":"Пресети групи","reset.schedule":"Розклад","source.manual":"Вручну","source.mirror":"Дзеркало","source.schedule":"Розклад","source.sync":"Sync","source.window":"Вікно","status.active":"Активно","status.blocking_for":"уже {duration}","status.boost":"Boost {minutes} хв","status.divergence":"{count} відхилення","status.hold":"Утримання {minutes} хв","status.isolated":"{count} ізольовано","status.layer_bypass":"Обхід","status.layer_fallback":"Резерв","status.low_battery":"{count} з низьким зарядом батареї","status.next":"Наступний {time}","status.no_deviations":"Немає відхилень","status.offset":"Зміщення {value}","status.oob":"{count} поза межами","tile.fan":"Режим вентилятора","tile.mode":"Режим","tile.preset":"Пресет","tile.swing":"Режим коливання","tile.swing_horizontal":"Горизонтальне коливання"},zh:{"action.cooling":"制冷中","action.drying":"除湿中","action.fan":"送风","action.heating":"制热中","action.idle":"空闲","action.off":"关闭","block.presence":"离开","block.switch":"主开关：关闭","block.switch_release":"主开关：手动控制","block.switch_temperature":"主开关：温度","block.window":"窗户已打开","card.entity_not_found":"未找到实体：{entity}","card.more_info":"更多信息","common.decrease":"降低","common.humidity":"湿度","common.increase":"升高","common.temperature":"温度","demo.group":"演示组","demo.room.bathroom":"浴室","demo.room.bedroom":"卧室","demo.room.kitchen":"厨房","demo.room.living_room":"客厅","demo.schedule":"演示计划","demo.slot":"演示时段","demo.vacation":"假期","editor.battery":"电池","editor.control.buttons":"−/+ 按钮","editor.control.slider":"滑块","editor.control.toggle":"温度/湿度切换","editor.controls":"控件","editor.demo":"演示模式（合成数据；无需实体）","editor.group_entity":"群组实体","editor.main_switch":"主开关","editor.main_switch_missing":"此实体没有主开关 — 只有开启了“高级功能”的组才有。","editor.reset":"重置按钮","editor.reset_empty":"未选择任何选项 — 卡片不显示重置按钮。","editor.reset_missing":"此实体不提供重置 — 只有开启了“高级功能”的组才提供。","editor.section.badges":"徽章","editor.section.deviations":"偏差","editor.section.panel":"面板","editor.status_cell":"状态区","editor.title":"标题","editor.title_placeholder":"使用实体名称","feature.calibration":"校准","feature.isolation":"隔离","feature.presence":"人员在场","feature.schedule":"计划","feature.sync":"同步","feature.window":"窗户","humidity.target":"目标湿度","main_switch.label":"主开关","member.low_battery":"电量低","member.unavailable":"不可用","mode.auto":"自动","mode.cool":"制冷","mode.dry":"除湿","mode.fan_only":"仅送风","mode.heat":"制热","mode.heat_cool":"制热/制冷","mode.off":"关闭","reset.boost":"Boost","reset.bypass":"计划旁路","reset.fallback":"计划后备","reset.label":"重置","reset.offset":"温度偏移","reset.presets":"组预设","reset.schedule":"计划","source.manual":"手动","source.mirror":"镜像","source.schedule":"计划","source.sync":"同步","source.window":"窗户","status.active":"活动中","status.blocking_for":"已 {duration}","status.boost":"Boost {minutes} 分钟","status.divergence":"{count} 处分歧","status.hold":"保持 {minutes} 分钟","status.isolated":"{count} 个已隔离","status.layer_bypass":"旁路","status.layer_fallback":"后备","status.low_battery":"{count} 个电量低","status.next":"下一个 {time}","status.no_deviations":"无偏差","status.offset":"偏移 {value}","status.oob":"{count} 个超出范围","tile.fan":"风速模式","tile.mode":"模式","tile.preset":"预设","tile.swing":"摆风模式","tile.swing_horizontal":"水平摆风"}},Qi=t=>(t??"en").split("-")[0].toLowerCase(),bt=(t,e,o)=>{const s=(Ne[Qi(t)]??Ne.en)[e]??Ne.en[e]??e;return o?s.replace(/\{(\w+)\}/g,(a,n)=>n in o?String(o[n]):a):s},_t=(t,e,o)=>{var a;if(!o)return"";const i=`${e}.${o}`,s=((a=t==null?void 0:t.locale)==null?void 0:a.language)??(t==null?void 0:t.language);return i in Ne.en?bt(s,i):o},wo=(t,e,o)=>e?_t(t,"action",e):_t(t,"mode",o);function B(t){return class extends t{t(e,o){var s,a,n;const i=((a=(s=this.hass)==null?void 0:s.locale)==null?void 0:a.language)??((n=this.hass)==null?void 0:n.language);return bt(i,e,o)}}}var Xi=Object.defineProperty,es=Object.getOwnPropertyDescriptor,Ue=(t,e,o,i)=>{for(var s=i>1?void 0:i?es(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&Xi(e,o,s),s};let de=class extends B(w){constructor(){super(...arguments),this.disabled=!1}get _outlineStyle(){return this.color?Be({"--cgh-btn-outline":this.color}):c}_emit(t){this.dispatchEvent(new CustomEvent("cgh-step",{detail:{direction:t},bubbles:!0,composed:!0}))}render(){return d`
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
    `}};de.styles=A`
    :host {
      display: flex;
      gap: 24px;
      justify-content: center;
    }
    .btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid
        var(--cgh-btn-outline, var(--secondary-text-color));
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .btn:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
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
  `,Ue([m({attribute:!1})],de.prototype,"hass",2),Ue([m({type:Boolean})],de.prototype,"disabled",2),Ue([m()],de.prototype,"color",2),de=Ue([C("cgh-number-buttons")],de);const ue=t=>{const e=t==null?void 0:t.locale;if(!e)return t==null?void 0:t.language;switch(e.number_format){case"comma_decimal":return["en-US","en"];case"decimal_comma":return["de","es","it"];case"space_comma":return["fr","sv","cs"];case"quote_decimal":return["de-CH"];case"system":return;default:return e.language}},ts=(t,e,o)=>{var l,p;const i=t instanceof Date?t:new Date(t),s=(l=e==null?void 0:e.locale)==null?void 0:l.time_format,a=((p=e==null?void 0:e.locale)==null?void 0:p.language)??(e==null?void 0:e.language),n=s==="system"?void 0:a,r=s==="12"||(s==="language"||s==="system"||!s)&&new Date("January 1, 2026 22:00:00").toLocaleString(n).includes("10");try{return new Intl.DateTimeFormat(s==="system"?void 0:a,{hourCycle:r?"h12":"h23",...o}).format(i)}catch{return i.toLocaleTimeString()}},os=(t,e)=>{var s;const o=t<60?"minute":t<1440?"hour":"day",i=o==="minute"?t:o==="hour"?t/60:t/1440;return new Intl.NumberFormat(((s=e==null?void 0:e.locale)==null?void 0:s.language)??(e==null?void 0:e.language),{style:"unit",unit:o,unitDisplay:"short"}).format(Math.max(1,Math.floor(i)))},is=(t,e)=>{var r,l;if(!t)return;const o=((l=(r=e==null?void 0:e.config)==null?void 0:r.unit_system)==null?void 0:l.temperature)??"°C",i=p=>new Intl.NumberFormat(ue(e),{maximumFractionDigits:1}).format(p),s=t.target_temp_low,a=t.target_temp_high;if(s!=null&&a!=null)return`${i(s)}–${i(a)} ${o}`;const n=t.temperature;return n!=null?`${i(n)} ${o}`:void 0},ko=(t,e,o=!1)=>{var a,n;const i=new Intl.NumberFormat(ue(e),{minimumFractionDigits:1,maximumFractionDigits:1,signDisplay:"exceptZero"}).format(t);if(o)return`${i}°`;const s=((n=(a=e==null?void 0:e.config)==null?void 0:a.unit_system)==null?void 0:n.temperature)??"°C";return`${i} ${s}`},$o=(t,e=Date.now())=>{if(typeof t!="string")return null;const o=new Date(t).getTime()-e;return o>0?Math.ceil(o/6e4):null};var ss="M18 16H14V18H18V20L21 17L18 14V16M11 4C8.8 4 7 5.8 7 8S8.8 12 11 12 15 10.2 15 8 13.2 4 11 4M11 14C6.6 14 3 15.8 3 18V20H12.5C12.2 19.2 12 18.4 12 17.5C12 16.3 12.3 15.2 12.9 14.1C12.3 14.1 11.7 14 11 14",as="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16",ns="M6 14H9L5 18L1 14H4C4 11.3 5.7 6.6 11 6.1V8.1C7.6 8.6 6 11.9 6 14M20 14C20 11.3 18.3 6.6 13 6.1V8.1C16.4 8.7 18 11.9 18 14H15L19 18L23 14H20Z",rs="M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",ls="M16,18H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",cs="M16,17H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",ds="M16,15H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",us="M16,14H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",hs="M16,13H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",ms="M16,12H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",ps="M16,10H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",fs="M16,9H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",gs="M16,8H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",bs="M14 20H6V6H14M14.67 4H13V2H7V4H5.33C4.6 4 4 4.6 4 5.33V20.67C4 21.4 4.6 22 5.33 22H14.67C15.4 22 16 21.4 16 20.67V5.33C16 4.6 15.4 4 14.67 4M21 7H19V13H21V8M21 15H19V17H21V15Z",_s="M16,20H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",vs="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z",ys="M14,4L16.29,6.29L13.41,9.17L14.83,10.59L17.71,7.71L20,10V4M10,4H4V10L6.29,7.71L11,12.41V20H13V11.59L7.71,6.29",ws="M12 8L15 13.2L18 10.5L17.3 14H6.7L6 10.5L9 13.2L12 8M12 4L8.5 10L3 5L5 16H19L21 5L15.5 10L12 4M19 18H5V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V18Z",ks="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",$s="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",xs="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z",As="M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z",Cs="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",Es="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13",Ss="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z",Os="M13.13 22.19L11.5 18.36C13.07 17.78 14.54 17 15.9 16.09L13.13 22.19M5.64 12.5L1.81 10.87L7.91 8.1C7 9.46 6.22 10.93 5.64 12.5M21.61 2.39C21.61 2.39 16.66 .269 11 5.93C8.81 8.12 7.5 10.53 6.65 12.64C6.37 13.39 6.56 14.21 7.11 14.77L9.24 16.89C9.79 17.45 10.61 17.63 11.36 17.35C13.5 16.53 15.88 15.19 18.07 13C23.73 7.34 21.61 2.39 21.61 2.39M14.54 9.46C13.76 8.68 13.76 7.41 14.54 6.63S16.59 5.85 17.37 6.63C18.14 7.41 18.15 8.68 17.37 9.46C16.59 10.24 15.32 10.24 14.54 9.46M8.88 16.53L7.47 15.12L8.88 16.53M6.24 22L9.88 18.36C9.54 18.27 9.21 18.12 8.91 17.91L4.83 22H6.24M2 22H3.41L8.18 17.24L6.76 15.83L2 20.59V22M2 19.17L6.09 15.09C5.88 14.79 5.73 14.47 5.64 14.12L2 17.76V19.17Z",Ms="M20.79,13.95L18.46,14.57L16.46,13.44V10.56L18.46,9.43L20.79,10.05L21.31,8.12L19.54,7.65L20,5.88L18.07,5.36L17.45,7.69L15.45,8.82L13,7.38V5.12L14.71,3.41L13.29,2L12,3.29L10.71,2L9.29,3.41L11,5.12V7.38L8.5,8.82L6.5,7.69L5.92,5.36L4,5.88L4.47,7.65L2.7,8.12L3.22,10.05L5.55,9.43L7.55,10.56V13.45L5.55,14.58L3.22,13.96L2.7,15.89L4.47,16.36L4,18.12L5.93,18.64L6.55,16.31L8.55,15.18L11,16.62V18.88L9.29,20.59L10.71,22L12,20.71L13.29,22L14.7,20.59L13,18.88V16.62L15.5,15.17L17.5,16.3L18.12,18.63L20,18.12L19.53,16.35L21.3,15.88L20.79,13.95M9.5,10.56L12,9.11L14.5,10.56V13.44L12,14.89L9.5,13.44V10.56Z",Ts="M12.92 1.58L11.18 2.58L12.39 4.67L11.8 6.85L9 7.6L7.38 6L7.42 3.59L5.43 3.59L5.43 5.42L3.59 5.42L3.6 7.42L6 7.42L7.65 9.03L6.9 11.82L4.68 12.4L2.59 11.2L1.59 12.93L3.17 13.84L2.26 15.42L4 16.42L5.19 14.33L7.42 13.75L7.92 14.26L9.32 12.86L8.78 12.32L9.53 9.54L12.32 8.78L12.85 9.32L14.26 7.91L13.73 7.37L14.32 5.19L16.41 4L15.41 2.25L13.83 3.16L12.92 1.58M20.72 4L4 20.72L5.27 22L10.16 17.11C10.63 17.43 11.15 17.68 11.71 17.83C14.38 18.55 17.12 16.96 17.83 14.29C18.22 12.86 17.93 11.36 17.11 10.16L22 5.27L20.72 4M18.74 9C19.18 9.63 19.53 10.38 19.75 11.19C19.97 12 20.03 12.81 19.96 13.61L22.65 10.41L18.74 9M19.32 15.95C19 16.67 18.5 17.35 17.93 17.94C17.34 18.53 16.66 19 15.96 19.34L20.05 20.06L19.32 15.95M9 18.71L10.41 22.66L13.59 19.95C12.81 20 12 19.97 11.19 19.76C10.36 19.54 9.62 19.17 9 18.71Z",Ls="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z",Hs="M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",Ps="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22C12.4 22 12.7 22 13.1 21.9L15.4 15.3L14.8 14.7C15.5 14 16 13 16 11.9C16 11.2 15.8 10.5 15.4 9.9L17.6 7.7C18.5 9 19 10.4 19 12H20C20.3 12 20.6 12.1 20.8 12.2C20.8 12.2 20.9 12.2 20.9 12.3C21.3 12.5 21.7 12.9 21.9 13.4C22 12.9 22 12.5 22 12C22 6.5 17.5 2 12 2M14 8.6C13.4 8.2 12.7 8 12 8C9.8 8 8 9.8 8 12C8 13.1 8.4 14.1 9.2 14.8L7.1 16.9C5.8 15.7 5 13.9 5 12C5 8.1 8.1 5 12 5C13.6 5 15 5.5 16.2 6.4L14 8.6M20 14H18L14.8 23H16.7L17.4 21H20.6L21.3 23H23.2L20 14M17.8 19.7L19 16L20.2 19.7H17.8Z",Vs="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z",zs="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z",Ds="M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z",js="M21 20V2H3V20H1V23H23V20M19 4V11H17V4M5 4H7V11H5M5 20V13H7V20M9 20V4H15V20M17 20V13H19V20Z";const vt=Hs,Rs=Ss,Fe=Ds,Is=ks,Bs=xs,Ns=Ms,xo=Es,Ao=$s,Us=Ts,Fs=Ps,Co=zs,Eo=ns,yt=js,So=ss,Ks=Os,Ws=Vs,wt=Cs,Oo=as,Zs=ws,kt=vs,$t=Ls,Mo=As,Gs=ys,To=bs,Ys={10:ls,20:cs,30:ds,40:us,50:hs,60:ms,70:ps,80:fs,90:gs,100:rs},qs=t=>t<=5?_s:Ys[Math.min(100,Math.round(t/10)*10)],Lo=t=>{switch(t){case"cool":return Ns;case"dry":return Fe;case"fan_only":return Ao;case"auto":return Fs;case"heat":return Bs;case"off":return xo;case"heat_cool":return Us;default:return vt}},Js=1e4;class Ho{constructor(e){this.host=e,this._values={},e.addController(this)}get(e){return this._values[e]}set(e){this._values={...this._values,...e},clearTimeout(this._timer),this._timer=setTimeout(()=>this.clear(),Js),this.host.requestUpdate()}sync(e,o){for(const i of Object.keys(this._values))((e==null?void 0:e.entity_id)!==(o==null?void 0:o.entity_id)||(e==null?void 0:e.attributes[i])!==(o==null?void 0:o.attributes[i]))&&delete this._values[i]}clear(){clearTimeout(this._timer),this._timer=void 0,this._values={},this.host.requestUpdate()}hostDisconnected(){this.clear()}}var Qs=Object.defineProperty,Xs=Object.getOwnPropertyDescriptor,Se=(t,e,o,i)=>{for(var s=i>1?void 0:i?Xs(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&Qs(e,o,s),s};const ea=1,ta=2;let J=class extends w{constructor(){super(...arguments),this.buttons=!0,this._bound="low",this._pending=new Ho(this)}willUpdate(t){t.has("stateObj")&&this._pending.sync(t.get("stateObj"),this.stateObj)}_target(t){var e;return this._pending.get(t)??((e=this.stateObj)==null?void 0:e.attributes[t])}get _min(){var t;return((t=this.stateObj)==null?void 0:t.attributes.min_temp)??5}get _max(){var t;return((t=this.stateObj)==null?void 0:t.attributes.max_temp)??35}get _features(){var t;return((t=this.stateObj)==null?void 0:t.attributes.supported_features)??0}get _supportsTemperature(){var t;return(this._features&ea)!==0&&((t=this.stateObj)==null?void 0:t.attributes.temperature)!=null}get _supportsRange(){var t,e;return(this._features&ta)!==0&&((t=this.stateObj)==null?void 0:t.attributes.target_temp_low)!=null&&((e=this.stateObj)==null?void 0:e.attributes.target_temp_high)!=null}get _step(){var e,o,i,s;const t=(e=this.stateObj)==null?void 0:e.attributes.target_temp_step;return t||(((s=(i=(o=this.hass)==null?void 0:o.config)==null?void 0:i.unit_system)==null?void 0:s.temperature)==="°F"?1:.5)}get _digits(){var t;return((t=this._step.toString().split(".")[1])==null?void 0:t.length)??0}get _unit(){var t,e,o,i;return((o=(e=(t=this.hass)==null?void 0:t.config)==null?void 0:e.unit_system)==null?void 0:o.temperature)??((i=this.stateObj)==null?void 0:i.attributes.unit_of_measurement)??""}get _mode(){var i,s;const t=(i=this.stateObj)==null?void 0:i.state,e=(((s=this.stateObj)==null?void 0:s.attributes.hvac_modes)??[]).filter(a=>a==="heat"||a==="cool"||a==="heat_cool"),o=e.length===1&&(t==="auto"||t==="off")?e[0]:t;return o==="heat"?"start":o==="cool"?"end":"full"}get _inactive(){var e;const t=(e=this.stateObj)==null?void 0:e.state;return t==="off"||t==="unavailable"||t==="unknown"}_stateColor(){var t;switch((t=this.stateObj)==null?void 0:t.state){case"heat":return"var(--state-climate-heat-color, #ff5722)";case"cool":return"var(--state-climate-cool-color, #2196f3)";case"heat_cool":return"var(--state-climate-heat-cool-color, var(--state-climate-heat-color, #ffb300))";case"auto":return"var(--state-climate-auto-color, #4caf50)";case"dry":return"var(--state-climate-dry-color, #ff9800)";case"fan_only":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-inactive-color, var(--disabled-color, #9e9e9e))"}}_actionColor(){var e;const t=(e=this.stateObj)==null?void 0:e.attributes.hvac_action;if(!(!t||t==="idle"||t==="off"||this._inactive))switch(t){case"cooling":return"var(--state-climate-cool-color, #2196f3)";case"drying":return"var(--state-climate-dry-color, #ff9800)";case"fan":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-climate-heat-color, #ff5722)"}}_big(t,e=!0){if(t==null)return d`<span class="big"><span class="int">—</span></span>`;const o=new Intl.NumberFormat(ue(this.hass),{minimumFractionDigits:this._digits,maximumFractionDigits:this._digits}).format(t),i=o.includes(".")?o.split(".")[0]:o.split(",")[0],s=o.slice(i.length);return d`
      <span class="big">
        <span class="int">${i}</span>
        <span class="addon">
          <span class="decimal">${s}</span>
          <span class="unit">${e?this._unit:""}</span>
        </span>
      </span>
    `}_send(t){!this.hass||!this.stateObj||(this._pending.set(t),this.hass.callService("climate","set_temperature",{entity_id:this.stateObj.entity_id,...t}))}_setSingle(t){this._send({temperature:t})}_setRange(t,e){this._send({target_temp_low:t,target_temp_high:e})}_onStep(t){const e=o=>gt(o+t.detail.direction*this._step,this._min,this._max,this._step);if(this._supportsRange){const o=this._target("target_temp_low"),i=this._target("target_temp_high");if(this._bound==="low"){const s=e(o);s!==o&&s<=i&&this._setRange(s,i)}else{const s=e(i);s!==i&&s>=o&&this._setRange(o,s)}}else if(this._supportsTemperature){const o=this._target("temperature"),i=e(o);i!==o&&this._setSingle(i)}}_renderInfo(t,e,o,i,s){var p,f,u;const a=wo(this.hass,(p=this.stateObj)==null?void 0:p.attributes.hvac_action,(f=this.stateObj)==null?void 0:f.state),n=(u=this.stateObj)==null?void 0:u.attributes.current_humidity,r=this._actionColor(),l=Be(r?{color:r}:{});return d`
      <div class="overlay">
        ${a?d`<div class="action" style=${l}>${a}</div>`:c}
        ${t?d`<div class="range">
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
              </div>`:d`<div class="primary">${this._big(o)}</div>`}
        ${e!=null||n!=null?d`<div class="secondary" style=${l}>
                ${e!=null?d`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${vt} />
                        </svg>
                        ${new Intl.NumberFormat(ue(this.hass),{maximumFractionDigits:1}).format(e)}
                        ${this._unit}
                      </span>`:c}
                ${e!=null&&n!=null?d`<span class="sep">·</span>`:c}
                ${n!=null?d`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${Fe} />
                        </svg>
                        ${new Intl.NumberFormat(ue(this.hass),{maximumFractionDigits:0}).format(n)}
                        %
                      </span>`:c}
              </div>`:c}
      </div>
    `}render(){if(!this.stateObj)return c;const e=this.stateObj.attributes.current_temperature,o=this._supportsRange,i=!o&&this._supportsTemperature,s=o?this._target("target_temp_low"):void 0,a=o?this._target("target_temp_high"):void 0,n=i?this._target("temperature"):void 0;return d`
      <div
        class="wrap"
        style=${Be({"--cgh-slider-color":this._stateColor(),"--cgh-slider-low":"var(--state-climate-heat-color, #ff5722)","--cgh-slider-high":"var(--state-climate-cool-color, #2196f3)","--cgh-action-color":this._actionColor()??"transparent"})}
      >
        <div class="dial">
          <div class="glow"></div>
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${this._mode}
            .inactive=${this._inactive}
            .dual=${o}
            .bound=${this._bound}
            .value=${n??c}
            .low=${s??c}
            .high=${a??c}
            .current=${e??c}
            .disabled=${!i&&!o}
            @value-changed=${r=>r.detail.value!=null&&this._setSingle(r.detail.value)}
            @low-changed=${r=>{const l=r.detail.value;l!=null&&a!=null&&this._setRange(l,a)}}
            @high-changed=${r=>{const l=r.detail.value;l!=null&&s!=null&&this._setRange(s,l)}}
          ></cgh-circular-slider>

          ${this._renderInfo(o,e,n,s,a)}
          ${this.buttons&&(i||o)?d`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .color=${o&&!this._inactive?this._bound==="high"?"var(--state-climate-cool-color, #2196f3)":"var(--state-climate-heat-color, #ff5722)":void 0}
                    @cgh-step=${this._onStep}
                  ></cgh-number-buttons>
                </div>`:c}
        </div>
      </div>
    `}};J.styles=A`
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
  `,Se([m({attribute:!1})],J.prototype,"hass",2),Se([m({attribute:!1})],J.prototype,"stateObj",2),Se([m({type:Boolean})],J.prototype,"buttons",2),Se([E()],J.prototype,"_bound",2),J=Se([C("cgh-climate-temperature")],J);var oa=Object.defineProperty,ia=Object.getOwnPropertyDescriptor,Ke=(t,e,o,i)=>{for(var s=i>1?void 0:i?ia(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&oa(e,o,s),s};let he=class extends B(w){constructor(){super(...arguments),this.buttons=!0,this._pending=new Ho(this)}willUpdate(t){t.has("stateObj")&&this._pending.sync(t.get("stateObj"),this.stateObj)}get _target(){var t;return this._pending.get("humidity")??((t=this.stateObj)==null?void 0:t.attributes.humidity)}get _current(){var t;return(t=this.stateObj)==null?void 0:t.attributes.current_humidity}get _min(){var t;return((t=this.stateObj)==null?void 0:t.attributes.min_humidity)??0}get _max(){var t;return((t=this.stateObj)==null?void 0:t.attributes.max_humidity)??100}get _step(){var t;return((t=this.stateObj)==null?void 0:t.attributes.target_humidity_step)??1}get _inactive(){var e;const t=(e=this.stateObj)==null?void 0:e.state;return t==="off"||t==="unavailable"||t==="unknown"}_color(){return this._inactive?"var(--state-inactive-color, var(--disabled-color, #9e9e9e))":"var(--state-humidifier-on-color, #2196f3)"}_set(t){!this.hass||!this.stateObj||(this._pending.set({humidity:t}),this.hass.callService("climate","set_humidity",{entity_id:this.stateObj.entity_id,humidity:t}))}_onStep(t){const e=this._target;if(e==null)return;const o=gt(e+t.detail.direction*this._step,this._min,this._max,this._step);o!==e&&this._set(o)}_format(t){return new Intl.NumberFormat(ue(this.hass),{maximumFractionDigits:0}).format(t)}render(){if(!this.stateObj)return c;const t=this._target,e=this._current;return d`
      <div
        class="wrap"
        style=${Be({"--cgh-slider-color":this._color()})}
      >
        <div class="dial">
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${"start"}
            .inactive=${this._inactive}
            .value=${t??c}
            .current=${e??c}
            @value-changed=${o=>o.detail.value!=null&&this._set(o.detail.value)}
          ></cgh-circular-slider>

          <div class="overlay">
            <div class="action">${this.t("humidity.target")}</div>
            ${t!=null?d`<div class="primary">
                    <span class="int">${this._format(t)}</span
                    ><span class="unit">%</span>
                  </div>`:c}
            ${e!=null?d`<div class="secondary">
                    <svg viewBox="0 0 24 24">
                      <path d=${Fe} />
                    </svg>
                    ${this._format(e)} %
                  </div>`:c}
          </div>

          ${this.buttons?d`<div class="buttons">
                <cgh-number-buttons
                  .hass=${this.hass}
                  @cgh-step=${this._onStep}
                ></cgh-number-buttons>
              </div>`:c}
        </div>
      </div>
    `}};he.styles=A`
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
  `,Ke([m({attribute:!1})],he.prototype,"hass",2),Ke([m({attribute:!1})],he.prototype,"stateObj",2),Ke([m({type:Boolean})],he.prototype,"buttons",2),he=Ke([C("cgh-climate-humidity")],he);var sa=Object.defineProperty,aa=Object.getOwnPropertyDescriptor,Oe=(t,e,o,i)=>{for(var s=i>1?void 0:i?aa(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&sa(e,o,s),s};const na=4;let Q=class extends B(w){constructor(){super(...arguments),this.controls=["slider","buttons","toggle"],this._view="temperature"}get _hasHumidity(){var e;return((((e=this.stateObj)==null?void 0:e.attributes.supported_features)??0)&na)!==0}render(){const t=this.controls.includes("slider"),e=t&&this._hasHumidity&&this.controls.includes("toggle"),o=e?this._view:"temperature";return t?d`
      <div class="control">
        ${o==="humidity"?d`<cgh-climate-humidity
                .hass=${this.hass}
                .stateObj=${this.stateObj}
                .buttons=${this.controls.includes("buttons")}
              ></cgh-climate-humidity>`:d`<cgh-climate-temperature
                .hass=${this.hass}
                .stateObj=${this.stateObj}
                .buttons=${this.controls.includes("buttons")}
              ></cgh-climate-temperature>`}
        ${e?d`<div class="toggle">
                <button
                  class="seg ${o==="temperature"?"active":""}"
                  aria-label=${this.t("common.temperature")}
                  @click=${()=>this._view="temperature"}
                >
                  <svg viewBox="0 0 24 24"><path d=${vt} /></svg>
                </button>
                <button
                  class="seg ${o==="humidity"?"active":""}"
                  aria-label=${this.t("common.humidity")}
                  @click=${()=>this._view="humidity"}
                >
                  <svg viewBox="0 0 24 24"><path d=${Fe} /></svg>
                </button>
              </div>`:c}
      </div>
    `:c}};Q.styles=A`
    :host {
      display: block;
    }
    .control {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toggle {
      align-self: center;
      display: flex;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      background: var(--secondary-background-color, rgba(255, 255, 255, 0.08));
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
    }
    .seg.active {
      background: var(--primary-text-color);
      color: var(--card-background-color);
    }
    .seg svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
  `,Oe([m({attribute:!1})],Q.prototype,"hass",2),Oe([m({attribute:!1})],Q.prototype,"stateObj",2),Oe([m({attribute:!1})],Q.prototype,"controls",2),Oe([E()],Q.prototype,"_view",2),Q=Oe([C("cgh-climate-control")],Q);const xt=["panel","badges","deviations"],At=["slider","buttons","toggle"],Ct=["mode","preset","fan","swing","swing_horizontal"],Et=["boost","offset","schedule","bypass","fallback","presets"],Po={boost:"reset.boost",offset:"reset.offset",schedule:"reset.schedule",bypass:"reset.bypass",fallback:"reset.fallback",presets:"reset.presets"},St=["boost","offset","schedule","bypass"],Ot=t=>{const e=t==null?void 0:t.status;return e===!1?null:Array.isArray(e)?xt.filter(o=>e.includes(o)):[...xt]},Mt=t=>{const e=t==null?void 0:t.features;return Array.isArray(e)?Ct.filter(o=>e.includes(o)):[...Ct]},Vo=t=>(t==null?void 0:t.battery)!==!1,Tt=t=>{const e=t==null?void 0:t.controls;return Array.isArray(e)?At.filter(o=>e.includes(o)):[...At]},zo=t=>{var e;return((e=t==null?void 0:t.attributes)==null?void 0:e.effective_sync_mode)!==void 0},Do=t=>(t==null?void 0:t.main_switch)===!0,ra=t=>Array.isArray(t==null?void 0:t.reset),Lt=t=>{const e=t==null?void 0:t.reset;return Array.isArray(e)?Et.filter(o=>e.includes(o)):[]};var la=Object.defineProperty,ca=Object.getOwnPropertyDescriptor,We=(t,e,o,i)=>{for(var s=i>1?void 0:i?ca(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&la(e,o,s),s};let me=class extends w{constructor(){super(...arguments),this.label="",this.description=""}_tap(){this.dispatchEvent(new CustomEvent("cgh-action",{bubbles:!0,composed:!0}))}render(){const t=this.description||this.label;return d`
      <button
        class="tile"
        title=${t}
        aria-label=${t}
        @click=${this._tap}
      >
        ${this.icon?d`<svg class="lead" viewBox="0 0 24 24">
                <path d=${this.icon} />
              </svg>`:c}
        <span class="label">${this.label}</span>
      </button>
    `}};me.styles=A`
    :host {
      display: block;
      min-width: 0;
      font-size: var(--ha-font-size-m, 0.875rem);
    }
    .tile {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      box-sizing: border-box;
      border: none;
      border-radius: var(--ha-border-radius-lg, 16px);
      background: color-mix(
        in srgb,
        var(--disabled-color, #bdbdbd) 20%,
        transparent
      );
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      cursor: pointer;
      overflow: hidden;
    }
    .tile:hover {
      background: color-mix(
        in srgb,
        var(--disabled-color, #bdbdbd) 30%,
        transparent
      );
    }
    .lead {
      flex: none;
      width: 20px;
      height: 20px;
      fill: var(--secondary-text-color);
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,We([m()],me.prototype,"icon",2),We([m()],me.prototype,"label",2),We([m()],me.prototype,"description",2),me=We([C("cgh-action-tile")],me);var da=Object.defineProperty,ua=Object.getOwnPropertyDescriptor,z=(t,e,o,i)=>{for(var s=i>1?void 0:i?ua(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&da(e,o,s),s};let T=class extends w{constructor(){super(...arguments),this.label="",this.options=[],this.disabled=!1,this.reselect=!1,this._open=!1,this._up=!1,this._onDocumentClick=t=>{t.composedPath().includes(this)||(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick)}get _valueLabel(){var t;return((t=this.options.find(e=>e.value===this.value))==null?void 0:t.label)??this.value??""}_toggle(){if(this.disabled)return;if(this._open){this._open=!1;return}const t=this.getBoundingClientRect(),e=Math.min(this.options.length*48+8,400),o=window.innerHeight-t.bottom;this._up=o<e&&t.top>o,this._open=!0}_select(t){this._open=!1,!(t===this.value&&!this.reselect)&&this.dispatchEvent(new CustomEvent("cgh-select",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return d`
      <div class="wrap">
        <button class="tile" ?disabled=${this.disabled} @click=${this._toggle}>
          ${this.icon?d`<svg class="lead" viewBox="0 0 24 24">
                  <path d=${this.icon} />
                </svg>`:c}
          <span class="content">
            <span class="label">${this.label}</span>
            <span class="value">${this._valueLabel}</span>
          </span>
        </button>
        ${this._open?d`<div class="menu ${this._up?"up":""}" role="listbox">
                ${this.options.map(t=>d`<button
                    class="option ${t.value===this.value?"selected":""}"
                    role="option"
                    aria-selected=${t.value===this.value}
                    @click=${()=>this._select(t.value)}
                  >
                    ${t.icon?d`<svg viewBox="0 0 24 24">
                            <path d=${t.icon} />
                          </svg>`:c}
                    <span>${t.label}</span>
                  </button>`)}
              </div>`:c}
      </div>
    `}};T.styles=A`
    :host {
      display: block;
      min-width: 0;
      font-size: var(--ha-font-size-m, 0.875rem);
    }
    .wrap {
      position: relative;
    }
    .tile {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      box-sizing: border-box;
      border: none;
      border-radius: var(--ha-border-radius-lg, 16px);
      background: color-mix(
        in srgb,
        var(--disabled-color, #bdbdbd) 20%,
        transparent
      );
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      cursor: pointer;
      overflow: hidden;
    }
    .tile:hover {
      background: color-mix(
        in srgb,
        var(--disabled-color, #bdbdbd) 30%,
        transparent
      );
    }
    .tile:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .lead {
      flex: none;
      width: 20px;
      height: 20px;
      fill: var(--secondary-text-color);
    }
    .content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      flex: 1;
      min-width: 0;
    }
    .label {
      font-size: var(--ha-font-size-s, 0.75rem);
      letter-spacing: 0.4px;
      color: var(--secondary-text-color);
    }
    .value {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
  `,z([m()],T.prototype,"icon",2),z([m()],T.prototype,"label",2),z([m()],T.prototype,"value",2),z([m({attribute:!1})],T.prototype,"options",2),z([m({type:Boolean})],T.prototype,"disabled",2),z([m({type:Boolean})],T.prototype,"reselect",2),z([E()],T.prototype,"_open",2),z([E()],T.prototype,"_up",2),T=z([C("cgh-select-tile")],T);var ha=Object.defineProperty,ma=Object.getOwnPropertyDescriptor,Me=(t,e,o,i)=>{for(var s=i>1?void 0:i?ma(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&ha(e,o,s),s};const pa=8,fa=16,ga=32,ba=512;let X=class extends B(w){constructor(){super(...arguments),this.tiles=["mode","preset","fan","swing","swing_horizontal"],this.reset=[]}_call(t,e){!this.hass||!this.stateObj||this.hass.callService("climate",t,{entity_id:this.stateObj.entity_id,...e})}_reset(){!this.hass||!this.stateObj||!this.reset.length||this.hass.callService("climate_group_helper","reset",{entity_id:this.stateObj.entity_id,...Object.fromEntries(this.reset.map(t=>[t,!0]))})}_options(t,e){const o=this.stateObj;return e.map(i=>{var s,a;return{value:i,label:((a=(s=this.hass)==null?void 0:s.formatEntityAttributeValue)==null?void 0:a.call(s,o,t,i))??i}})}render(){const t=this.stateObj,e=t==null?void 0:t.attributes;if(!t||!e)return c;const o=e.supported_features??0,i=e.hvac_modes??[],s=e.preset_modes??[],a=e.fan_modes??[],n=e.swing_modes??[],r=e.swing_horizontal_modes??[];return d`
      <div class="tiles">
        ${this.tiles.includes("mode")&&i.length?d`<cgh-select-tile
                .icon=${Lo(t.state)}
                .label=${this.t("tile.mode")}
                .value=${t.state}
                .options=${i.map(l=>({value:l,label:_t(this.hass,"mode",l),icon:Lo(l)}))}
                @cgh-select=${l=>this._call("set_hvac_mode",{hvac_mode:l.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("preset")&&(o&fa)!==0&&s.length?d`<cgh-select-tile
                .icon=${Co}
                .label=${this.t("tile.preset")}
                .value=${e.preset_mode}
                .options=${this._options("preset_mode",s)}
                .reselect=${!0}
                @cgh-select=${l=>this._call("set_preset_mode",{preset_mode:l.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("fan")&&(o&pa)!==0&&a.length?d`<cgh-select-tile
                .icon=${Ao}
                .label=${this.t("tile.fan")}
                .value=${e.fan_mode}
                .options=${this._options("fan_mode",a)}
                @cgh-select=${l=>this._call("set_fan_mode",{fan_mode:l.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("swing")&&(o&ga)!==0&&n.length?d`<cgh-select-tile
                .icon=${Eo}
                .label=${this.t("tile.swing")}
                .value=${e.swing_mode}
                .options=${this._options("swing_mode",n)}
                @cgh-select=${l=>this._call("set_swing_mode",{swing_mode:l.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("swing_horizontal")&&(o&ba)!==0&&r.length?d`<cgh-select-tile
                .icon=${Eo}
                .label=${this.t("tile.swing_horizontal")}
                .value=${e.swing_horizontal_mode}
                .options=${this._options("swing_horizontal_mode",r)}
                @cgh-select=${l=>this._call("set_swing_horizontal_mode",{swing_horizontal_mode:l.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.reset.length?d`<cgh-action-tile
                .icon=${Rs}
                .label=${this.t("reset.label")}
                .description=${`${this.t("reset.label")}: ${this.reset.map(l=>this.t(Po[l])).join(", ")}`}
                @cgh-action=${this._reset}
              ></cgh-action-tile>`:c}
      </div>
    `}};X.styles=A`
    :host {
      display: block;
    }
    .tiles {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
    .tiles cgh-select-tile,
    .tiles cgh-action-tile {
      flex: 1 1 120px;
      max-width: 160px;
    }
  `,Me([m({attribute:!1})],X.prototype,"hass",2),Me([m({attribute:!1})],X.prototype,"stateObj",2),Me([m({attribute:!1})],X.prototype,"tiles",2),Me([m({attribute:!1})],X.prototype,"reset",2),X=Me([C("cgh-feature-tiles")],X);const Ht=30,_a=70,jo=new WeakMap,va=t=>{let e=jo.get(t);if(!e){e=new Map;for(const[o,i]of Object.entries(t)){if(!i.device_id)continue;const s=e.get(i.device_id);s?s.push(o):e.set(i.device_id,[o])}jo.set(t,e)}return e},Pt=t=>t.entity_id.startsWith("binary_sensor."),ya=t=>{if(Pt(t))return t.state==="on"?0:t.state==="off"?100:void 0;const e=String(t.state).trim();if(!e)return;const o=Number(e);return Number.isFinite(o)?o:void 0},Ro=(t,e)=>{var a;const o=e==null?void 0:e.entities;if(!e||!o)return[];const i=va(o),s=[];for(const n of t){const r=(a=o[n])==null?void 0:a.device_id;if(!r)continue;const l=(i.get(r)??[]).flatMap(p=>{const f=e.states[p];if(!f||f.attributes.device_class!=="battery"||!(Pt(f)||p.startsWith("sensor.")))return[];const u=ya(f);return u===void 0?[]:[{state:f,level:u}]});l.length&&s.push([n,l])}return s},wa=(t,e)=>{const o={};for(const[i,s]of Ro(t,e)){const a=s.filter(r=>r.level<Ht),n=a.find(r=>!Pt(r.state))??a[0];n&&(o[i]=n.state)}return o},ka=(t,e)=>{let o;for(const[i,s]of Ro(t,e))for(const a of s)(!o||a.level<o.level)&&(o={member:i,...a});return o},$a=t=>t<Ht?"low":t<_a?"medium":"high";class xa{constructor(e,o=15e3){this.host=e,this.intervalMs=o,e.addController(this)}hostConnected(){this._timer=window.setInterval(()=>this.host.requestUpdate(),this.intervalMs)}hostDisconnected(){this._timer!==void 0&&(window.clearInterval(this._timer),this._timer=void 0)}}class Io{constructor(e,o){this.host=e,this.remaining=o,e.addController(this)}hostUpdated(){this._clear();const e=this.remaining();e>0&&(this._timer=window.setTimeout(()=>this.host.requestUpdate(),e+50))}hostDisconnected(){this._clear()}_clear(){this._timer!==void 0&&(window.clearTimeout(this._timer),this._timer=void 0)}}const Bo=A`
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
`;function Aa(t){return t==="bypass"?"status.layer_bypass":t==="fallback"?"status.layer_fallback":"source.schedule"}const Ca=["hvac_mode","preset_mode","fan_mode","swing_mode","swing_horizontal_mode","humidity"],Ea=["temperature","target_temp_low","target_temp_high"],No=.05,Sa=3e3;function Vt(t,e=Date.now()){const o=Date.parse(String((t==null?void 0:t.last_changed)??""));return Number.isNaN(o)?0:Math.max(0,o+Sa-e)}function Uo(t,e,o,i,s,a=Date.now()){if(!t||(t.blocking_sources??[]).length||t.boost_until||Vt(t,a)>0)return!1;const n=t.target_state??{},r=n[o];if(r==null||i==null)return!1;if(Ea.includes(o)){if((t.enabled_features??[]).includes("range_template")||n.hvac_mode==="off")return!1;const p=t.member_offsets??{},f=Number(r)+(t.group_offset??0)+(p[e]??0);return Math.abs(Number(i)-f)>No}if(o==="humidity")return Math.abs(Number(i)-Number(r))>No;const l=s==null?void 0:s.hvac_modes;return o==="hvac_mode"&&Array.isArray(l)&&!l.includes(r)?!1:String(i)!==String(r)}function Fo(t,e,o,i){var n,r;const s=t==null?void 0:t.states[e];return(s?o==="hvac_mode"?(n=t==null?void 0:t.formatEntityState)==null?void 0:n.call(t,s,String(i)):(r=t==null?void 0:t.formatEntityAttributeValue)==null?void 0:r.call(t,s,o,i):void 0)??String(i)}const Oa=["switch","window","presence","boost","hold","schedule"];function Ma(t,e=Oa){for(const o of e){const i=t.find(s=>s.kind===o);if(i)return i}}function Ko(t,e={}){var s;const o=(t==null?void 0:t.member_divergence)??{},i=new Set;for(const[a,n]of Object.entries(o))for(const[r,l]of Object.entries(n))Uo(t,r,a,l,(s=e[r])==null?void 0:s.attributes)&&i.add(r);return[...i]}function Wo(t,e,o=[],i=[],s,a=[]){return t.map(n=>{var r;return{id:n,state:((r=e[n])==null?void 0:r.state)??"unavailable",isolated:o.includes(n),oob:i.includes(n),deviates:a.includes(n),master:n===s}})}function Zo(t){const e=t.state==="off"?"off":t.state==="unavailable"||t.state==="unknown"?"unavailable":"active",o=[t.isolated?"isolated":"",t.oob?"oob":"",t.deviates?"deviates":"",t.master?"master":""].filter(Boolean).join(" ");return o?`${e} ${o}`:e}var Ta=Object.defineProperty,La=Object.getOwnPropertyDescriptor,N=(t,e,o,i)=>{for(var s=i>1?void 0:i?La(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&Ta(e,o,s),s};const Ha=["temperature","target_temp_low","target_temp_high"];let V=class extends B(w){constructor(){super(...arguments),this.members=[],this.isolated=[],this.oob=[],this.lowBattery={},this._wake=new Io(this,()=>Vt(this.group))}get _divergence(){var t;return((t=this.group)==null?void 0:t.member_divergence)??{}}_deviates(t,e){var i,s;const o=this._divergence[e];return!!o&&t in o&&Uo(this.group,t,e,o[t],(s=(i=this.hass)==null?void 0:i.states[t])==null?void 0:s.attributes)}_values(t){const e=this._divergence;return Ca.filter(o=>t in(e[o]??{})).map(o=>({text:Fo(this.hass,t,o,e[o][t]),deviates:this._deviates(t,o)}))}_name(t){var e,o;return((o=(e=this.hass)==null?void 0:e.states[t])==null?void 0:o.attributes.friendly_name)??t}_action(t){var s;const e=(s=this.hass)==null?void 0:s.states[t],o=e==null?void 0:e.attributes.hvac_action,i=o??(e==null?void 0:e.state);return!i||i==="unavailable"||i==="unknown"?this.t("member.unavailable"):wo(this.hass,o,e==null?void 0:e.state)}_batteryText(t){var e,o;return t.entity_id.startsWith("binary_sensor.")?this.t("member.low_battery"):((o=(e=this.hass)==null?void 0:e.formatEntityState)==null?void 0:o.call(e,t,t.state))??`${t.state} %`}render(){var e,o;if(!this.members.length)return c;const t=Wo(this.members,((e=this.hass)==null?void 0:e.states)??{},this.isolated,this.oob,this.master,Ko(this.group,(o=this.hass)==null?void 0:o.states));return d`
      <div class="list" role="list">
        ${t.map(i=>{var l,p,f,u;const s=is((p=(l=this.hass)==null?void 0:l.states[i.id])==null?void 0:p.attributes,this.hass),a=this._values(i.id),n=(u=(f=this.group)==null?void 0:f.member_offsets)==null?void 0:u[i.id],r=Ha.some(_=>this._deviates(i.id,_));return d`
            <div class="member" role="listitem">
              <span class="dot ${Zo(i)}"></span>
              <span class="name" title=${i.id}>${this._name(i.id)}</span>
              <span class="marks">${i.master?d`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${Zs} />
                  </svg>`:c}${i.isolated?d`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${wt} />
                  </svg>`:c}${i.oob?d`<svg class="mark oob" viewBox="0 0 24 24">
                    <path d=${Oo} />
                  </svg>`:c}${i.id in this.lowBattery?d`<svg class="mark battery" viewBox="0 0 24 24">
                    <title>${this._batteryText(this.lowBattery[i.id])}</title>
                    <path d=${To} />
                  </svg>`:c}</span>
              <span class="values">${a.length?a.map((_,$)=>d`${$?" · ":c}<span
                          class="value ${_.deviates?"deviates":""}"
                          >${_.text}</span
                        >`):c}</span>
              <span class="action">${this._action(i.id)}</span>
              <span class="offset">${n?ko(n,this.hass,!0):c}</span>
              <span class="target ${r?"deviates":""}"
                >${s??c}</span
              >
            </div>
          `})}
      </div>
    `}};V.styles=[Bo,A`
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
      .marks {
        display: inline-flex;
        gap: 4px;
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
    `],N([m({attribute:!1})],V.prototype,"hass",2),N([m({attribute:!1})],V.prototype,"members",2),N([m({attribute:!1})],V.prototype,"isolated",2),N([m({attribute:!1})],V.prototype,"oob",2),N([m({attribute:!1})],V.prototype,"master",2),N([m({attribute:!1})],V.prototype,"lowBattery",2),N([m({attribute:!1})],V.prototype,"group",2),V=N([C("cgh-member-list")],V);var Pa=Object.defineProperty,Va=Object.getOwnPropertyDescriptor,ee=(t,e,o,i)=>{for(var s=i>1?void 0:i?Va(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&Pa(e,o,s),s};const za=10,Da=["window","presence","schedule","sync","isolation","calibration"],Go={switch:{labelKey:"block.switch",icon:xo},window:{labelKey:"block.window",icon:yt},presence:{labelKey:"block.presence",icon:So}},ja=t=>t==="temperature"?"block.switch_temperature":t==="release"?"block.switch_release":"block.switch",Yo={window:{labelKey:"feature.window",icon:yt},presence:{labelKey:"feature.presence",icon:So},schedule:{labelKey:"feature.schedule",icon:kt},sync:{labelKey:"feature.sync",icon:$t},isolation:{labelKey:"feature.isolation",icon:wt},calibration:{labelKey:"feature.calibration",icon:Co}},zt={ui:{labelKey:"source.manual",icon:Mo},group:{labelKey:"source.manual",icon:Mo},sync_mode:{labelKey:"source.sync",icon:$t},adopt_only:{labelKey:"source.mirror",icon:$t},window_control:{labelKey:"source.window",icon:yt},schedule:{labelKey:"source.schedule",icon:kt}};let D=class extends B(w){constructor(){super(...arguments),this.sections=["panel","badges","deviations"],this.battery=!0,this._clock=new xa(this),this._wake=new Io(this,()=>{var t;return Vt((t=this.stateObj)==null?void 0:t.attributes)}),this._membersOpen=!1,this._membersUp=!1,this._onDocumentClick=t=>{if(!this._membersOpen)return;const e=this.renderRoot.querySelector(".members");e&&!t.composedPath().includes(e)&&(this._membersOpen=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick)}_toggleMembers(){var e;if(this._membersOpen){this._membersOpen=!1;return}const t=(e=this.renderRoot.querySelector(".members"))==null?void 0:e.getBoundingClientRect();if(t){const o=window.innerHeight-t.bottom;this._membersUp=o<320&&t.top>o}this._membersOpen=!0}_items(){var a;const t=(a=this.stateObj)==null?void 0:a.attributes;if(!t)return[];const e=[],o=t.blocking_reason;if(o!=null&&o.source&&Go[o.source]){const n=Go[o.source],r=o.source==="switch"?ja(t.main_switch_action):n.labelKey,l=o.since?Date.parse(o.since):NaN,p=Number.isNaN(l)?void 0:Math.floor((Date.now()-l)/6e4);e.push({kind:o.source,icon:n.icon,label:this.t(r),detail:p==null?void 0:this.t("status.blocking_for",{duration:os(p,this.hass)})})}const i=$o(t.boost_until);i!=null&&e.push({kind:"boost",icon:Ks,label:this.t("status.boost",{minutes:i})});const s=$o(t.schedule_hold_until);return s!=null&&e.push({kind:"hold",icon:Ws,label:this.t("status.hold",{minutes:s})}),t.active_schedule_slot_title&&e.push({kind:"schedule",icon:kt,label:this._scheduleLabel()}),e}_panel(t){var i;const e=Ma(t);if(e)return e;const o=(i=this.stateObj)==null?void 0:i.attributes.last_source;if(o&&zt[o])return{kind:"source",icon:zt[o].icon,label:o==="schedule"?this._scheduleLabel():this.t(zt[o].labelKey)}}_scheduleLabel(){var t;return this.t(Aa((t=this.stateObj)==null?void 0:t.attributes.active_schedule_layer))}_offset(){var i;const t=(i=this.stateObj)==null?void 0:i.attributes,e=t==null?void 0:t.group_offset;if(!(!e||((t==null?void 0:t.blocking_sources)??[]).length||t!=null&&t.boost_until))return this.t("status.offset",{value:ko(e,this.hass)})}_featureActive(t){var i;const e=((i=this.stateObj)==null?void 0:i.attributes)??{},o=e.blocking_sources??[];switch(t){case"window":return o.includes("window");case"presence":return o.includes("presence");case"schedule":return e.last_source==="schedule";case"sync":return e.last_source==="sync_mode"||e.last_source==="adopt_only";case"isolation":return(e.isolated_members??[]).length>0;default:return!1}}_featurePaused(t){var i;const e=((i=this.stateObj)==null?void 0:i.attributes)??{},o=e.config_overrides??{};switch(t){case"window":return o.window_mode==="disabled";case"presence":return o.presence_mode==="disabled";case"calibration":return o.calibration_mode==="disabled";case"sync":return e.effective_sync_mode==="disabled";case"isolation":return o.isolation_bypass==="all";default:return!1}}_scheduleOn(){var e,o,i;const t=(e=this.stateObj)==null?void 0:e.attributes.active_schedule_entity;return!!t&&((i=(o=this.hass)==null?void 0:o.states[t])==null?void 0:i.state)==="on"}_nextEvent(t){var i,s;if(!t)return;const e=(s=(i=this.hass)==null?void 0:i.states[t])==null?void 0:s.attributes.next_event;if(!e)return;const o=new Date(e);if(!isNaN(o.getTime()))return ts(o,this.hass,{hour:"2-digit",minute:"2-digit"})}_name(t){var e,o;return((o=(e=this.hass)==null?void 0:e.states[t])==null?void 0:o.attributes.friendly_name)??t}_batteryText(t){var o,i;const e=(i=(o=this.hass)==null?void 0:o.formatEntityState)==null?void 0:i.call(o,t,t.state);return e||(t.entity_id.startsWith("binary_sensor.")?t.state==="on"?this.t("member.low_battery"):t.state:`${t.state} %`)}_names(t){return t.map(e=>this._name(e)).join(", ")}_divergenceLabel(t){var o,i;if(t==="hvac_mode")return this.t("tile.mode");const e=this.stateObj;return e&&((i=(o=this.hass)==null?void 0:o.formatEntityAttributeName)==null?void 0:i.call(o,e,t))||t}_divergenceText(t,e){return Object.entries(e).map(([o,i])=>`${this._name(o)} ${Fo(this.hass,o,t,i)}`).join(", ")}render(){var _e,ve,Le;const t=(_e=this.stateObj)==null?void 0:_e.attributes;if(!t)return c;const e=this._items(),o=this._panel(e),i=this.sections.includes("panel"),s=this.sections.includes("badges"),a=this.sections.includes("deviations"),n=t.enabled_features??[],r=Da.filter(g=>n.includes(g)),l=t.isolated_members??[],p=t.oob_members??[],f=t.member_divergence??{},u=Object.keys(f),_=t.member_entities??[],$=this.battery?wa(_,this.hass):{},L=Object.keys($),te=this.battery?ka(_,this.hass):void 0,b=!!(l.length||p.length||u.length||L.length),ge=t.master_entity_id,x=Wo(_,((ve=this.hass)==null?void 0:ve.states)??{},l,p,ge,Ko(t,(Le=this.hass)==null?void 0:Le.states)),be=x.slice(0,za),O=x.length-be.length,F=t.total_member_count??x.length,Ut=t.active_member_count??x.filter(g=>g.state!=="off"&&g.state!=="unavailable"&&g.state!=="unknown").length,Ft=t.active_schedule_slot_title,Kt=t.active_schedule_entity,oe=Ft||(this._scheduleOn()?this.t("status.active"):void 0),H=t.active_schedule_layer==="bypass"?void 0:this._nextEvent(Kt),j=this._offset();return d`
      <div class="status">
        ${i?d`<div class="panel ${(o==null?void 0:o.kind)??""}">
                ${j||F?d`<div class="panel-top">
                ${te?d`<svg
                      class="battery ${$a(te.level)}"
                      viewBox="0 0 24 24"
                    >
                      <title
                        >${this._name(te.member)}: ${this._batteryText(te.state)}</title
                      >
                      <path d=${qs(te.level)} />
                    </svg>`:c}
                ${j?d`<span class="offset">${j}</span>`:c}
                ${F?d`<div class="members">
                        <button
                          class="members-toggle"
                          aria-expanded=${this._membersOpen}
                          @click=${this._toggleMembers}
                        >
                          <span class="dots">
                            ${be.map(g=>d`<span
                                  class="dot ${Zo(g)}"
                                  title=${this._name(g.id)}
                                ></span>`)}
                            ${O>0?d`<span class="more">+${O}</span>`:c}
                          </span>
                          <span class="count">${Ut}/${F}</span>
                        </button>
                        ${this._membersOpen?d`<div
                                class="members-menu ${this._membersUp?"up":""}"
                              >
                                <cgh-member-list
                                  .hass=${this.hass}
                                  .members=${_}
                                  .isolated=${l}
                                  .oob=${p}
                                  .lowBattery=${$}
                                  .master=${ge}
                                  .group=${t}
                                ></cgh-member-list>
                              </div>`:c}
                      </div>`:c}
                      </div>`:c}
                ${o?d`<div class="panel-main">
                        <svg viewBox="0 0 24 24"><path d=${o.icon} /></svg>
                        <span
                          >${o.label}${o.detail?d` <span class="detail">· ${o.detail}</span>`:c}</span
                        >
                      </div>`:c}
                ${oe||H?d`<div class="panel-info">
                        ${oe?d`<span class="slot">${oe}</span>`:c}
                        ${H?d`<span class="next"
                              >${this.t("status.next",{time:H})}</span
                            >`:c}
                      </div>`:c}
              </div>`:c}
        ${s&&(r.length||e.some(g=>g.kind==="boost"))?d`<div class="badges">
                ${r.map(g=>d`<div
                    class="badge feature ${g} ${this._featureActive(g)?"on":this._featurePaused(g)?"paused":""}"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d=${Yo[g].icon} />
                    </svg>
                    <span>${this.t(Yo[g].labelKey)}</span>
                  </div>`)}
                ${e.filter(g=>g.kind==="boost"||g.kind==="hold").map(g=>d`<div class="badge ${g.kind} on">
                      <svg viewBox="0 0 24 24"><path d=${g.icon} /></svg>
                      <span>${g.label}</span>
                    </div>`)}
              </div>`:c}
        ${a?d`<div class="deviations ${b?"":"empty"}">
                ${l.length?d`<div class="deviation isolation">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${wt} />
                          </svg>
                          <span
                            >${this.t("status.isolated",{count:l.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(l)}</div>
                      </div>`:c}
                ${p.length?d`<div class="deviation oob">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${Oo} />
                          </svg>
                          <span
                            >${this.t("status.oob",{count:p.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(p)}</div>
                      </div>`:c}
                ${L.length?d`<div class="deviation battery">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${To} />
                          </svg>
                          <span
                            >${this.t("status.low_battery",{count:L.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(L)}</div>
                      </div>`:c}
                ${u.length?d`<div class="deviation divergence">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${Gs} />
                          </svg>
                          <span
                            >${this.t("status.divergence",{count:u.length})}</span
                          >
                        </div>
                        <div class="dev-names">
                          ${u.map(g=>`${this._divergenceLabel(g)}: ${this._divergenceText(g,f[g])}`).join(" · ")}
                        </div>
                      </div>`:c}
                ${b?c:d`<div class="deviation none">
                        ${this.t("status.no_deviations")}
                      </div>`}
              </div>`:c}
      </div>
    `}};D.styles=[Bo,A`
    :host {
      display: block;
    }
    .status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
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
      /* Glass surface over the previous base colour: the secondary-background-color
         stays underneath, a theme-adaptive translucent tint on top shifts its tone
         (works on light and dark themes, unlike a white-only rgba), plus a hairline
         border and soft shadow. */
      background:
        linear-gradient(
          color-mix(in srgb, var(--primary-text-color) 6%, transparent),
          color-mix(in srgb, var(--primary-text-color) 6%, transparent)
        ),
        var(--secondary-background-color, rgba(255, 255, 255, 0.06));
      backdrop-filter: blur(14px) saturate(1.3);
      -webkit-backdrop-filter: blur(14px) saturate(1.3);
      border: 1px solid
        color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.18);
    }
    /* Offset on the left, member strip on the right; either may be absent. */
    .panel-top {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
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
    /* Paused by a slot or preset. */
    .badge.paused {
      color: var(--disabled-color, #9e9e9e);
      opacity: 0.5;
    }
    .deviations {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      /* One frame around all entries, a touch stronger than the divider. */
      border: 1px dashed
        color-mix(in srgb, var(--primary-text-color) 28%, transparent);
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
    `],ee([m({attribute:!1})],D.prototype,"hass",2),ee([m({attribute:!1})],D.prototype,"stateObj",2),ee([m({attribute:!1})],D.prototype,"sections",2),ee([m({attribute:!1})],D.prototype,"battery",2),ee([E()],D.prototype,"_membersOpen",2),ee([E()],D.prototype,"_membersUp",2),D=ee([C("cgh-status")],D);const Dt="climate.demo",qo="schedule.demo_schedule",Jo="calendar.demo_calendar",jt="calendar.demo_vacation",Rt="switch.demo_main_switch",Qo=3500,S=[{id:"climate.demo_living_room",nameKey:"demo.room.living_room"},{id:"climate.demo_bedroom",nameKey:"demo.room.bedroom",battery:"sensor.demo_bedroom_battery"},{id:"climate.demo_bathroom",nameKey:"demo.room.bathroom",battery:"sensor.demo_bathroom_battery"},{id:"climate.demo_kitchen",nameKey:"demo.room.kitchen",battery:"binary_sensor.demo_kitchen_battery_low"}],Ra=Object.fromEntries(S.flatMap(t=>{const e=`demo_device_${t.id}`;return(t.battery?[t.id,t.battery]:[t.id]).map(i=>[i,{entity_id:i,device_id:e}])})),Ia=S[0].id,Ba=S[2].id,Na=1,Ua=1,Fa=2,Ka=4,Wa=8,Za=16,Ga=32,Ya=512,Xo=["heat","cool","heat_cool","auto","dry","fan_only","off"],qa=Xo.filter(t=>t!=="off"),ei=["none","eco","comfort","away"],It=["low","medium","high"],Ja=["window","presence","schedule","sync","isolation","range_template","calibration","master"],Qa=12,Xa=15,en=16,tn=2,ti=25,Bt=t=>Math.round(t*10)/10,on=t=>Math.round(t*2)/2,sn=t=>t.length?t.reduce((e,o)=>e+o,0)/t.length:void 0,U=(t,e,o)=>({entity_id:t,state:e,attributes:o}),an=t=>{let e=t+1831565813|0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296},oi=(t,e,o,i,s)=>{switch(t){case"off":return"off";case"dry":return"drying";case"fan_only":return"fan";case"heat":return o!=null&&e<o?"heating":"idle";case"cool":return o!=null&&e>o?"cooling":"idle";default:{const a=i??(o!=null?o-.5:void 0),n=s??(o!=null?o+.5:void 0);return a!=null&&e<a?"heating":n!=null&&e>n?"cooling":"idle"}}},nn=(t,e={})=>{const o={};if(t.length<2)return o;const i=Object.fromEntries(t.map(s=>[s.entity_id,s.state]));new Set(Object.values(i)).size>1&&(o.hvac_mode=i);for(const s of["temperature","target_temp_low","target_temp_high"]){const a=t.filter(r=>r.attributes[s]!=null),n=a.map(r=>r.attributes[s]-(e[r.entity_id]??0));new Set(n).size>1&&(o[s]=Object.fromEntries(a.map(r=>[r.entity_id,r.attributes[s]])))}for(const s of["fan_mode","preset_mode"]){const a=Object.fromEntries(t.filter(n=>n.attributes[s]!=null).map(n=>[n.entity_id,n.attributes[s]]));new Set(Object.values(a)).size>1&&(o[s]=a)}return o},rn=(t=Date.now(),e)=>{const o=h=>bt(e,h),i=Math.floor(t/Qo),s=h=>an(Math.imul(i,2654435761)+h),a=(h,v)=>s(v)<h,n=(h,v)=>h[Math.floor(s(v)*h.length)],r=a(.6,2),l=a(.8,16),p=a(.7,15),f=Ja.filter((h,v)=>a(.5,100+v)),u=h=>f.includes(h),_=f.length>0,$=[["normal",10],["off",1],["boost",1],["hold",u("schedule")?1:0],["window_off",u("window")?1:0],["window_temperature",u("window")?1:0],["presence_off",u("presence")?1:0],["presence_offset",u("presence")?1:0],["presence_temperature",u("presence")?1:0],["presence_preset",u("presence")&&l?1:0],["switch_off",_?1:0],["switch_temperature",_?1:0],["switch_release",_?1:0]],L=$.reduce((h,[,v])=>h+v,0);let te=s(1)*L;const b=($.find(([,h])=>(te-=h)<0)??$[0])[0],ge=b==="normal"||b==="hold",x=[];b.startsWith("switch")&&x.push("switch"),b.startsWith("window")&&x.push("window"),b.startsWith("presence")&&x.push("presence"),b.startsWith("switch")&&u("window")&&a(.3,131)&&x.push("window"),(b.startsWith("switch")||b.startsWith("window"))&&u("presence")&&a(.3,132)&&x.push("presence");const be=["switch","window","presence"].find(h=>x.includes(h)),O={};u("window")&&!x.includes("window")&&a(.2,140)&&(O.window_mode="disabled"),u("presence")&&!x.includes("presence")&&a(.2,141)&&(O.presence_mode="disabled"),u("calibration")&&a(.2,142)&&(O.calibration_mode="disabled"),u("isolation")&&a(.2,143)&&(O.isolation_bypass="all"),u("sync")&&a(.2,144)&&(O.sync_mode="disabled");const F=u("sync")?O.sync_mode==="disabled"?"disabled":n(["lock","mirror","mirror_lock","master_lock","adopt_only"],145):"disabled",Ut=F==="disabled"||F==="lock"?[]:[F==="adopt_only"?"adopt_only":"sync_mode"],Ft=b==="switch_temperature"||b==="window_temperature"||b==="presence_offset"||b==="presence_temperature"||b==="presence_preset",Kt=b==="boost"&&a(.3,3),oe=b==="off"||Kt?"off":Ft||b==="boost"?"heat":n(qa,4),H=oe==="heat_cool"&&r,j=on(18+s(5)*6),_e=H?j-1.5:void 0,ve=H?j+1.5:void 0,Le=l?n(["none","none","eco","comfort"],6):void 0,g=p?n(It,11):void 0;let ie=oe,se=H?void 0:j,Ye=Le;switch(b){case"switch_off":case"window_off":case"presence_off":ie="off";break;case"switch_temperature":se=Xa;break;case"boost":ie="heat",se=ti;break;case"window_temperature":se=Qa;break;case"presence_offset":se=j-tn;break;case"presence_temperature":se=en;break;case"presence_preset":Ye="away";break}(b==="switch_off"||be==="window"&&b==="window_off")&&(ie="off");const si=Bt(19+s(7)*5),qe=a(.12,20)?Math.floor(s(21)*S.length):-1,He=u("isolation")&&!O.isolation_bypass&&a(.5,22)?[0,1,2,3].filter(h=>h!==qe)[Math.floor(s(23)*3)]:-1,Je=[0,1,2,3].filter(h=>h!==qe&&h!==He),$n=ge&&ie!=="off",Qe=(ge||b==="switch_release")&&ie!=="off",ye=$n&&a(.15,24)?n(Je,25):-1,Wt=Qe&&a(.3,26)?n(Je.filter(h=>h!==ye),27):-1,xn=Qe&&a(.5,28)?n(Je.filter(h=>h!==ye&&h!==Wt),29):-1,An=a(.5,30)?.5:-.5,ai=Je.filter(h=>h!==ye&&h!==Wt),Cn=Qe&&l&&a(.4,31)?n(ai,32):-1,En=n(ei.filter(h=>h!==Ye&&h!=="away"),33),Sn=Qe&&p&&a(.4,34)?n(ai,35):-1,On=n(It.filter(h=>h!==g),36),ni=_&&ge&&a(.3,82)?n([.5,1,1.5,-.5],84):0,Pe=_&&a(.4,85)?{[Ba]:Na}:{},Xe={},et=[];S.forEach((h,v)=>{const K=o(h.nameKey);if(v===qe){Xe[h.id]=U(h.id,"unavailable",{friendly_name:K});return}const ae=Bt(si+(s(40+v)-.5)),bi=v===He||v===ye||v===Wt?"off":ie,_i=ni+(Pe[h.id]??0),vi=(v===xn?An:0)+_i,yi=se!=null?se+vi:void 0,wi=_e!=null?_e+vi:void 0,ki=ve!=null?ve+_i:void 0,$i=U(h.id,bi,{friendly_name:K,current_temperature:ae,temperature:yi,target_temp_low:wi,target_temp_high:ki,preset_mode:v===Cn?En:Ye,fan_mode:v===Sn?On:g,hvac_action:oi(bi,ae,yi,wi,ki)});Xe[h.id]=$i,v!==He&&et.push($i)});const ri=et.filter(h=>h.state!=="off").length?ie:"off",tt=(h,v=!0)=>{const K=sn(et.filter(ae=>ae.attributes[h]!=null).map(ae=>ae.attributes[h]-(v?Pe[ae.entity_id]??0:0)));return K!=null?Bt(K):void 0},li=tt("current_temperature",!1)??si,ci=H?void 0:tt("temperature"),di=H?tt("target_temp_low"):void 0,ui=H?tt("target_temp_high"):void 0,hi=nn(et,Pe),Mn=Object.values(Xe).filter(h=>h.state!=="off"&&h.state!=="unavailable").length,Zt=a(.5,50),mi=Zt?Jo:qo,Ve=u("schedule")&&(b==="hold"||a(.6,51)),ot=u("schedule")&&b!=="hold"&&a(.2,52),pi=u("schedule")&&a(.5,53),it=u("schedule")?ot?"bypass":Ve?"main":pi?"fallback":"none":void 0,fi=["ui","group",...Ut],Gt=b==="hold"?n(fi,60):it&&it!=="none"&&a(.6,61)?"schedule":n(fi,62),Tn=new Date(t-Math.round(1+s(70)*20)*6e4),Ln=U(Dt,ri,{friendly_name:o("demo.group"),min_temp:5,max_temp:35,target_temp_step:.5,current_temperature:li,temperature:ci,target_temp_low:di,target_temp_high:ui,current_humidity:35+Math.round(s(8)*30),humidity:40+Math.round(s(9)*25),min_humidity:0,max_humidity:100,target_humidity_step:1,hvac_action:oi(ri,li,ci,di,ui),hvac_modes:Xo,preset_modes:ei,preset_mode:Ye,fan_modes:It,fan_mode:g,swing_modes:["off","on"],swing_mode:n(["off","on"],12),swing_horizontal_modes:["off","on"],swing_horizontal_mode:n(["off","on"],13),supported_features:Ua|(r?Fa:0)|(a(.6,14)?Ka:0)|(p?Wa:0)|(l?Za:0)|(a(.5,17)?Ga:0)|(a(.4,18)?Ya:0),active_member_count:Mn,total_member_count:S.length,member_entities:S.map(h=>h.id),enabled_features:f,blocking_sources:x,blocking_reason:be?{source:be,since:Tn.toISOString()}:void 0,isolated_members:He>=0?[S[He].id]:[],oob_members:ye>=0?[S[ye].id]:[],member_divergence:hi,config_overrides:Object.keys(O).length?O:void 0,effective_sync_mode:_?F:void 0,main_switch_entity_id:_?Rt:void 0,main_switch_action:_?b==="switch_temperature"?"temperature":b==="switch_release"?"release":"off":void 0,assumed_state:Object.keys(hi).length>0,last_source:Gt,last_entity:Gt==="sync_mode"||Gt==="adopt_only"?n(S,63).id:void 0,last_changed:new Date(t-(1+Math.round(s(64)*9))*6e4).toISOString(),active_schedule_entity:u("schedule")?mi:void 0,active_schedule_bypass_entity:u("schedule")?jt:void 0,active_schedule_layer:it,active_schedule_slot_title:ot?o("demo.vacation"):Ve&&Zt?o("demo.slot"):void 0,schedule_fallback_payload:pi?{temperature:17}:void 0,schedule_fallback_payload_active:it==="fallback"?!0:void 0,boost_temperature:b==="boost"?ti:void 0,boost_until:b==="boost"?new Date(t+(1+s(80)*15)*6e4).toISOString():void 0,schedule_hold_until:b==="hold"?new Date(t+(5+s(81)*55)*6e4).toISOString():void 0,group_offset:ni,target_state:{hvac_mode:oe,temperature:H?void 0:j,target_temp_low:_e,target_temp_high:ve,preset_mode:Le,fan_mode:g},member_offsets:Object.keys(Pe).length?Pe:void 0,master_entity_id:u("master")?Ia:void 0,master_fallback_active:u("master")&&qe===0,presence_fallback:u("presence")&&a(.2,83)?!0:void 0}),Hn=Zt?U(Jo,Ve?"on":"off",{friendly_name:o("demo.schedule"),message:Ve?o("demo.slot"):void 0}):U(qo,Ve?"on":"off",{friendly_name:o("demo.schedule"),next_event:new Date(t+(1+s(90)*90)*6e4).toISOString()}),Pn=U(jt,ot?"on":"off",{friendly_name:o("demo.vacation"),message:ot?o("demo.vacation"):void 0}),Vn=S.filter(h=>h.battery),zn=a(.3,150)?n(Vn,151).id:void 0,gi={};S.forEach((h,v)=>{if(!h.battery)return;const K=h.id===zn;gi[h.battery]=h.battery.startsWith("binary_sensor.")?U(h.battery,K?"on":"off",{device_class:"battery"}):U(h.battery,String(K?5+Math.round(s(152)*(Ht-10)):40+Math.round(s(153+v)*60)),{device_class:"battery",unit_of_measurement:"%"})});const Dn={entity_id:Rt,state:x.includes("switch")?"off":"on",attributes:{}};return{[Dt]:Ln,..._?{[Rt]:Dn}:{},[mi]:Hn,...u("schedule")?{[jt]:Pn}:{},...Xe,...gi}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ln=t=>t.strings===void 0,cn={},dn=(t,e=cn)=>t._$AH=e;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const un=_o(class extends vo{constructor(t){if(super(t),t.type!==q.PROPERTY&&t.type!==q.ATTRIBUTE&&t.type!==q.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!ln(t))throw Error("`live` bindings can only contain a single expression")}render(t){return t}update(t,[e]){if(e===M||e===c)return e;const o=t.element,i=t.name;if(t.type===q.PROPERTY){if(e===o[i])return M}else if(t.type===q.BOOLEAN_ATTRIBUTE){if(!!e===o.hasAttribute(i))return M}else if(t.type===q.ATTRIBUTE&&o.getAttribute(i)===e+"")return M;return dn(t),e}});async function hn(){var t,e,o,i;if(!customElements.get("ha-entity-picker"))try{const s=window.loadCardHelpers;if(s){const a=await s(),n=await((t=a==null?void 0:a.createCardElement)==null?void 0:t.call(a,{type:"entities",entities:[]}));if(await((e=n==null?void 0:n.getConfigElement)==null?void 0:e.call(n)),!customElements.get("ha-entity-picker")&&(a!=null&&a.createRowElement)){const r=await a.createRowElement({type:"attribute"});await((o=r==null?void 0:r.getConfigElement)==null?void 0:o.call(r))}}if(!customElements.get("ha-entity-picker")){const a=customElements.get("hui-glance-card");await((i=a==null?void 0:a.getConfigElement)==null?void 0:i.call(a))}}catch(s){console.warn("[climate-group-helper-card] Failed to preload HA form components:",s)}}var mn=Object.defineProperty,pn=Object.getOwnPropertyDescriptor,Ze=(t,e,o,i)=>{for(var s=i>1?void 0:i?pn(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&mn(e,o,s),s};const fn={panel:"editor.section.panel",badges:"editor.section.badges",deviations:"editor.section.deviations"},gn={slider:"editor.control.slider",buttons:"editor.control.buttons",toggle:"editor.control.toggle"},bn={mode:"tile.mode",preset:"tile.preset",fan:"tile.fan",swing:"tile.swing",swing_horizontal:"tile.swing_horizontal"};let pe=class extends B(w){setConfig(t){this._config=t}connectedCallback(){super.connectedCallback(),hn().then(()=>this.requestUpdate())}_emit(t){if(!this._config)return;const e={...this._config,...t};e.name===""&&delete e.name,e.battery!==!1&&delete e.battery,e.reset===void 0&&delete e.reset,e.main_switch!==!0&&delete e.main_switch,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}_entityChanged(t){this._emit({entity:t.detail.value})}_nameChanged(t){this._emit({name:t.target.value})}_demoChanged(t){var o;const e=t.target.checked;if(!e&&!((o=this._config)!=null&&o.entity)){this.requestUpdate();return}this._emit({demo:e})}_sectionChanged(t,e){const o=e.target.checked,i=Ot(this._config)??[];this._emit({status:o?[...i,t]:i.filter(s=>s!==t)})}_batteryChanged(t){this._emit({battery:t.target.checked})}_controlChanged(t,e){const o=e.target.checked,i=Tt(this._config);this._emit({controls:o?[...i,t]:i.filter(s=>s!==t)})}_mainSwitchChanged(t){this._emit({main_switch:t.target.checked})}_mainSwitchMissing(){var e,o;if(!this._config||this._config.demo||!this._config.entity)return!1;const t=(o=(e=this.hass)==null?void 0:e.states)==null?void 0:o[this._config.entity];return t!==void 0&&!t.attributes.main_switch_entity_id}_resetMissing(){var e,o;if(!this._config||this._config.demo||!this._config.entity)return!1;const t=(o=(e=this.hass)==null?void 0:e.states)==null?void 0:o[this._config.entity];return t!==void 0&&!zo(t)}_resetChanged(t){const e=t.target.checked;this._emit({reset:e?[...St]:void 0})}_resetFieldChanged(t,e){const o=e.target.checked,i=Lt(this._config);this._emit({reset:Et.filter(s=>s===t?o:i.includes(s))})}_tileChanged(t,e){const o=e.target.checked,i=Mt(this._config);this._emit({features:o?[...i,t]:i.filter(s=>s!==t)})}render(){if(!this._config)return c;const t=Ot(this._config),e=Mt(this._config),o=Tt(this._config),i=o.includes("slider"),s=Do(this._config),a=ra(this._config),n=Lt(this._config);return d`
      <div class="form">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity??""}
          .includeDomains=${["climate"]}
          allow-custom-entity
          .label=${this.t("editor.group_entity")}
          @value-changed=${this._entityChanged}
        ></ha-entity-picker>

        <label class="field">
          <span>${this.t("editor.title")}</span>
          <input
            type="text"
            .value=${this._config.name??""}
            placeholder=${this.t("editor.title_placeholder")}
            @input=${this._nameChanged}
          />
        </label>

        <label class="check">
          <input
            type="checkbox"
            .checked=${un(this._config.demo===!0)}
            @change=${this._demoChanged}
          />
          <span>${this.t("editor.demo")}</span>
        </label>

        <fieldset>
          <legend>${this.t("editor.controls")}</legend>
          <div class="sub">
            <label class="check">
              <input
                type="checkbox"
                class="main-switch"
                .checked=${s}
                @change=${this._mainSwitchChanged}
              />
              <span>${this.t("editor.main_switch")}</span>
            </label>
            ${s&&this._mainSwitchMissing()?d`<div class="hint main-switch-hint nested">
                    ${this.t("editor.main_switch_missing")}
                  </div>`:c}
            ${At.map(r=>d`
                <label
                  class="check ${r!=="slider"?"nested":""} ${r!=="slider"&&!i?"off":""}"
                >
                  <input
                    type="checkbox"
                    .checked=${o.includes(r)}
                    ?disabled=${r!=="slider"&&!i}
                    @change=${l=>this._controlChanged(r,l)}
                  />
                  <span>${this.t(gn[r])}</span>
                </label>
              `)}
            ${Ct.map(r=>d`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${e.includes(r)}
                    @change=${l=>this._tileChanged(r,l)}
                  />
                  <span>${this.t(bn[r])}</span>
                </label>
              `)}
            <label class="check">
              <input
                type="checkbox"
                class="reset"
                .checked=${a}
                @change=${this._resetChanged}
              />
              <span>${this.t("editor.reset")}</span>
            </label>
            ${Et.map(r=>d`
                <label class="check nested ${a?"":"off"}">
                  <input
                    type="checkbox"
                    class="reset-field"
                    .checked=${n.includes(r)}
                    ?disabled=${!a}
                    @change=${l=>this._resetFieldChanged(r,l)}
                  />
                  <span>${this.t(Po[r])}</span>
                </label>
              `)}
            ${a&&this._resetMissing()?d`<div class="hint reset-missing-hint nested">
                    ${this.t("editor.reset_missing")}
                  </div>`:a&&!n.length?d`<div class="hint reset-hint nested">${this.t("editor.reset_empty")}</div>`:c}
          </div>
        </fieldset>

        <fieldset>
          <legend>${this.t("editor.status_cell")}</legend>
          <div class="sub">
            ${xt.map(r=>d`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${(t==null?void 0:t.includes(r))??!1}
                    @change=${l=>this._sectionChanged(r,l)}
                  />
                  <span>${this.t(fn[r])}</span>
                </label>
              `)}
            <label class="check">
              <input
                type="checkbox"
                class="battery"
                .checked=${Vo(this._config)}
                @change=${this._batteryChanged}
              />
              <span>${this.t("editor.battery")}</span>
            </label>
          </div>
        </fieldset>
      </div>
    `}};pe.styles=A`
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
    .field input {
      padding: 8px 10px;
      border: 1px solid
        var(--divider-color, color-mix(in srgb, var(--primary-text-color) 20%, transparent));
      border-radius: var(--ha-border-radius-sm, 8px);
      background: var(--secondary-background-color, transparent);
      color: var(--primary-text-color);
      font: inherit;
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
    .check.off {
      opacity: 0.5;
    }
    /* Buttons and toggle belong to the dial, the fields to the reset tile. */
    .nested {
      padding-left: 24px;
    }
    .hint {
      font-size: var(--ha-font-size-s, 0.75rem);
      color: var(--secondary-text-color);
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
  `,Ze([m({attribute:!1})],pe.prototype,"hass",2),Ze([m({attribute:!1})],pe.prototype,"lovelace",2),Ze([E()],pe.prototype,"_config",2),pe=Ze([C("climate-group-helper-card-editor")],pe);var _n=Object.defineProperty,vn=Object.getOwnPropertyDescriptor,Ge=(t,e,o,i)=>{for(var s=i>1?void 0:i?vn(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&_n(e,o,s),s};let fe=class extends w{constructor(){super(...arguments),this.checked=!1,this.disabled=!1,this.label=""}_tap(){this.disabled||this.dispatchEvent(new CustomEvent("cgh-toggle",{detail:{checked:!this.checked},bubbles:!0,composed:!0}))}render(){return d`
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
    `}};fe.styles=A`
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
  `,Ge([m({type:Boolean})],fe.prototype,"checked",2),Ge([m({type:Boolean})],fe.prototype,"disabled",2),Ge([m()],fe.prototype,"label",2),fe=Ge([C("cgh-toggle")],fe);var yn=Object.defineProperty,wn=Object.getOwnPropertyDescriptor,Nt=(t,e,o,i)=>{for(var s=i>1?void 0:i?wn(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(i?n(e,o,s):n(s))||s);return i&&s&&yn(e,o,s),s};const kn=new Set(["type","entity","name","status","features","controls","battery","main_switch","reset","demo"]);let Te=class extends B(w){setConfig(t){if(!t.entity&&!t.demo)throw new Error('climate-group-helper-card: "entity" is required');for(const e of Object.keys(t))kn.has(e)||console.warn(`[climate-group-helper-card] ignoring unknown config key: ${e}`);this._config=t,this._syncDemoTimer()}connectedCallback(){super.connectedCallback(),this._syncDemoTimer()}disconnectedCallback(){super.disconnectedCallback(),this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_syncDemoTimer(){var e;const t=!!((e=this._config)!=null&&e.demo);t&&this._demoTimer===void 0?(this._demoTimer=window.setInterval(()=>this.requestUpdate(),Qo),this.requestUpdate()):!t&&this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_entityId(){var t,e;return(t=this._config)!=null&&t.demo?Dt:(e=this._config)==null?void 0:e.entity}_effectiveHass(){var t,e;if(this.hass)return(t=this._config)!=null&&t.demo?{...this.hass,states:{...this.hass.states,...rn(Date.now(),((e=this.hass.locale)==null?void 0:e.language)??this.hass.language)},entities:Ra,callService:async()=>{}}:this.hass}getCardSize(){return 6}static getStubConfig(t,e=[],o=[]){var r;const i="custom:climate-group-helper-card",s=[...e,...o],a=s.find(l=>{var p,f,u;return((u=(f=(p=t==null?void 0:t.states)==null?void 0:p[l])==null?void 0:f.attributes)==null?void 0:u.enabled_features)!==void 0});if(a)return zo((r=t==null?void 0:t.states)==null?void 0:r[a])?{type:i,entity:a,main_switch:!0,reset:[...St]}:{type:i,entity:a};const n=s.find(l=>l.startsWith("climate."));return n?{type:i,entity:n}:{type:i,demo:!0,main_switch:!0,reset:[...St]}}_mainSwitch(t,e){if(!Do(this._config))return;const o=e.attributes.main_switch_entity_id;return o?t.states[o]:void 0}_handleMainSwitch(t){const e=this._effectiveHass();e&&e.callService("switch",t.state==="on"?"turn_off":"turn_on",{entity_id:t.entity_id})}static async getConfigElement(){return document.createElement("climate-group-helper-card-editor")}_renderStatus(t,e){const o=Ot(this._config);return!o||!o.length?c:d`
      <div class="status">
        <cgh-status
          .hass=${t}
          .stateObj=${e}
          .sections=${o}
          .battery=${Vo(this._config)}
        ></cgh-status>
      </div>
    `}_handleMoreInfo(){var e;const t=this._entityId();!t||(e=this._config)!=null&&e.demo||this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t},bubbles:!0,composed:!0}))}render(){const t=this._effectiveHass(),e=this._entityId();if(!this._config||!t||!e)return c;const o=t.states[e],i=Tt(this._config);if(!o)return d`<ha-card class="warning"
        >${this.t("card.entity_not_found",{entity:e})}</ha-card
      >`;const s=this._mainSwitch(t,o);return d`
      <ha-card>
        ${s?d`<cgh-toggle
                class="main-switch"
                .checked=${s.state==="on"}
                .disabled=${s.state==="unavailable"||s.state==="unknown"}
                .label=${this.t("main_switch.label")}
                @cgh-toggle=${()=>this._handleMainSwitch(s)}
              ></cgh-toggle>`:c}
        ${this._config.demo?c:d`<button
                class="more-info"
                aria-label=${this.t("card.more_info")}
                @click=${this._handleMoreInfo}
              >
                <svg viewBox="0 0 24 24">
                  <path d=${Is} />
                </svg>
              </button>`}
        <div class="grid">
          <div class="title ${s?"with-switch":""}">
            ${this._config.name??o.attributes.friendly_name??e}
          </div>
          ${i.includes("slider")?d`<div class="center">
                  <cgh-climate-control
                    .hass=${t}
                    .stateObj=${o}
                    .controls=${i}
                  ></cgh-climate-control>
                </div>`:c}
          <div class="features">
            <cgh-feature-tiles
              .hass=${t}
              .stateObj=${o}
              .tiles=${Mt(this._config)}
              .reset=${Lt(this._config)}
            ></cgh-feature-tiles>
          </div>
          ${this._renderStatus(t,o)}
        </div>
      </ha-card>
    `}};Te.styles=A`
    :host {
      display: block;
      height: 100%;
      /* Shared content column: the dial and everything below it stay within
         this width, centred — nothing is drawn past the slider's edges. */
      --cgh-content-width: 320px;
    }
    ha-card {
      padding: 0;
      height: 100%;
    }
    .more-info {
      position: absolute;
      top: 0;
      right: 0;
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
    /* Mirrors the ⋮ button: 12px from the edge, centred in the same 48px row. */
    .main-switch {
      position: absolute;
      top: 4px;
      left: 12px;
      z-index: 1;
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto 1fr auto auto;
      grid-template-areas:
        "title"
        "center"
        "features"
        "status";
      height: 100%;
    }
    .title {
      grid-area: title;
      padding: 8px 30px;
      font-size: var(--ha-font-size-l, 1.1rem);
      font-weight: 400;
      line-height: var(--ha-line-height-expanded, 2);
      text-align: center;
    }
    /* 12px edge + 40px switch + 8px air, mirrored on the right so the title
       stays centred. */
    .title.with-switch {
      padding-left: 60px;
      padding-right: 60px;
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
    .features {
      grid-area: features;
      padding: 8px;
    }
    .status {
      grid-area: status;
    }
    .warning {
      color: var(--error-color, #db4437);
    }
  `,Nt([m({attribute:!1})],Te.prototype,"hass",2),Nt([E()],Te.prototype,"_config",2),Te=Nt([C("climate-group-helper-card")],Te),Fi({type:"climate-group-helper-card",name:"Climate Group Helper Card",description:"Dial, status and controls for a Climate Group Helper group.",preview:!0})})();
