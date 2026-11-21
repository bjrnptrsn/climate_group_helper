(function(){"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var Si;const ft=globalThis,Wt=ft.ShadowRoot&&(ft.ShadyCSS===void 0||ft.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,qt=Symbol(),Ko=new WeakMap;let Go=class{constructor(t,o,s){if(this._$cssResult$=!0,s!==qt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=o}get styleSheet(){let t=this.o;const o=this.t;if(Wt&&t===void 0){const s=o!==void 0&&o.length===1;s&&(t=Ko.get(o)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Ko.set(o,t))}return t}toString(){return this.cssText}};const Ji=e=>new Go(typeof e=="string"?e:e+"",void 0,qt),C=(e,...t)=>{const o=e.length===1?e[0]:t.reduce((s,i,a)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new Go(o,e,qt)},Xi=(e,t)=>{if(Wt)e.adoptedStyleSheets=t.map(o=>o instanceof CSSStyleSheet?o:o.styleSheet);else for(const o of t){const s=document.createElement("style"),i=ft.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=o.cssText,e.appendChild(s)}},Wo=Wt?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let o="";for(const s of t.cssRules)o+=s.cssText;return Ji(o)})(e):e;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Qi,defineProperty:ea,getOwnPropertyDescriptor:ta,getOwnPropertyNames:oa,getOwnPropertySymbols:sa,getPrototypeOf:ia}=Object,ee=globalThis,qo=ee.trustedTypes,aa=qo?qo.emptyScript:"",Zt=ee.reactiveElementPolyfillSupport,Ve=(e,t)=>e,bt={toAttribute(e,t){switch(t){case Boolean:e=e?aa:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let o=e;switch(t){case Boolean:o=e!==null;break;case Number:o=e===null?null:Number(e);break;case Object:case Array:try{o=JSON.parse(e)}catch{o=null}}return o}},Yt=(e,t)=>!Qi(e,t),Zo={attribute:!0,type:String,converter:bt,reflect:!1,useDefault:!1,hasChanged:Yt};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),ee.litPropertyMetadata??(ee.litPropertyMetadata=new WeakMap);let $e=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,o=Zo){if(o.state&&(o.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((o=Object.create(o)).wrapped=!0),this.elementProperties.set(t,o),!o.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,o);i!==void 0&&ea(this.prototype,t,i)}}static getPropertyDescriptor(t,o,s){const{get:i,set:a}=ta(this.prototype,t)??{get(){return this[o]},set(n){this[o]=n}};return{get:i,set(n){const r=i==null?void 0:i.call(this);a==null||a.call(this,n),this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Zo}static _$Ei(){if(this.hasOwnProperty(Ve("elementProperties")))return;const t=ia(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Ve("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Ve("properties"))){const o=this.properties,s=[...oa(o),...sa(o)];for(const i of s)this.createProperty(i,o[i])}const t=this[Symbol.metadata];if(t!==null){const o=litPropertyMetadata.get(t);if(o!==void 0)for(const[s,i]of o)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[o,s]of this.elementProperties){const i=this._$Eu(o,s);i!==void 0&&this._$Eh.set(i,o)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const o=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const i of s)o.unshift(Wo(i))}else t!==void 0&&o.push(Wo(t));return o}static _$Eu(t,o){const s=o.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(o=>this.enableUpdating=o),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(o=>o(this))}addController(t){var o;(this._$EO??(this._$EO=new Set)).add(t),this.renderRoot!==void 0&&this.isConnected&&((o=t.hostConnected)==null||o.call(t))}removeController(t){var o;(o=this._$EO)==null||o.delete(t)}_$E_(){const t=new Map,o=this.constructor.elementProperties;for(const s of o.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Xi(t,this.constructor.elementStyles),t}connectedCallback(){var t;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$EO)==null||t.forEach(o=>{var s;return(s=o.hostConnected)==null?void 0:s.call(o)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(o=>{var s;return(s=o.hostDisconnected)==null?void 0:s.call(o)})}attributeChangedCallback(t,o,s){this._$AK(t,s)}_$ET(t,o){var a;const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){const n=(((a=s.converter)==null?void 0:a.toAttribute)!==void 0?s.converter:bt).toAttribute(o,s.type);this._$Em=t,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,o){var a,n;const s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const r=s.getPropertyOptions(i),l=typeof r.converter=="function"?{fromAttribute:r.converter}:((a=r.converter)==null?void 0:a.fromAttribute)!==void 0?r.converter:bt;this._$Em=i;const u=l.fromAttribute(o,r.type);this[i]=u??((n=this._$Ej)==null?void 0:n.get(i))??u,this._$Em=null}}requestUpdate(t,o,s,i=!1,a){var n;if(t!==void 0){const r=this.constructor;if(i===!1&&(a=this[t]),s??(s=r.getPropertyOptions(t)),!((s.hasChanged??Yt)(a,o)||s.useDefault&&s.reflect&&a===((n=this._$Ej)==null?void 0:n.get(t))&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,o,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,o,{useDefault:s,reflect:i,wrapped:a},n){s&&!(this._$Ej??(this._$Ej=new Map)).has(t)&&(this._$Ej.set(t,n??o??this[t]),a!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(o=void 0),this._$AL.set(t,o)),i===!0&&this._$Em!==t&&(this._$Eq??(this._$Eq=new Set)).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(o){Promise.reject(o)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[a,n]of this._$Ep)this[a]=n;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[a,n]of i){const{wrapped:r}=n,l=this[a];r!==!0||this._$AL.has(a)||l===void 0||this.C(a,void 0,n,l)}}let t=!1;const o=this._$AL;try{t=this.shouldUpdate(o),t?(this.willUpdate(o),(s=this._$EO)==null||s.forEach(i=>{var a;return(a=i.hostUpdate)==null?void 0:a.call(i)}),this.update(o)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(o)}willUpdate(t){}_$AE(t){var o;(o=this._$EO)==null||o.forEach(s=>{var i;return(i=s.hostUpdated)==null?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(o=>this._$ET(o,this[o]))),this._$EM()}updated(t){}firstUpdated(t){}};$e.elementStyles=[],$e.shadowRootOptions={mode:"open"},$e[Ve("elementProperties")]=new Map,$e[Ve("finalized")]=new Map,Zt==null||Zt({ReactiveElement:$e}),(ee.reactiveElementVersions??(ee.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Pe=globalThis,Yo=e=>e,gt=Pe.trustedTypes,Jo=gt?gt.createPolicy("lit-html",{createHTML:e=>e}):void 0,Xo="$lit$",te=`lit$${Math.random().toFixed(9).slice(2)}$`,Qo="?"+te,na=`<${Qo}>`,re=document,Be=()=>re.createComment(""),Ie=e=>e===null||typeof e!="object"&&typeof e!="function",Jt=Array.isArray,ra=e=>Jt(e)||typeof(e==null?void 0:e[Symbol.iterator])=="function",Xt=`[ 	
\f\r]`,Re=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,es=/-->/g,ts=/>/g,le=RegExp(`>|${Xt}(?:([^\\s"'>=/]+)(${Xt}*=${Xt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),os=/'/g,ss=/"/g,is=/^(?:script|style|textarea|title)$/i,as=e=>(t,...o)=>({_$litType$:e,strings:t,values:o}),d=as(1),oe=as(2),j=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),ns=new WeakMap,ce=re.createTreeWalker(re,129);function rs(e,t){if(!Jt(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return Jo!==void 0?Jo.createHTML(t):t}const la=(e,t)=>{const o=e.length-1,s=[];let i,a=t===2?"<svg>":t===3?"<math>":"",n=Re;for(let r=0;r<o;r++){const l=e[r];let u,p,f=-1,_=0;for(;_<l.length&&(n.lastIndex=_,p=n.exec(l),p!==null);)_=n.lastIndex,n===Re?p[1]==="!--"?n=es:p[1]!==void 0?n=ts:p[2]!==void 0?(is.test(p[2])&&(i=RegExp("</"+p[2],"g")),n=le):p[3]!==void 0&&(n=le):n===le?p[0]===">"?(n=i??Re,f=-1):p[1]===void 0?f=-2:(f=n.lastIndex-p[2].length,u=p[1],n=p[3]===void 0?le:p[3]==='"'?ss:os):n===ss||n===os?n=le:n===es||n===ts?n=Re:(n=le,i=void 0);const g=n===le&&e[r+1].startsWith("/>")?" ":"";a+=n===Re?l+na:f>=0?(s.push(u),l.slice(0,f)+Xo+l.slice(f)+te+g):l+te+(f===-2?r:g)}return[rs(e,a+(e[o]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};class je{constructor({strings:t,_$litType$:o},s){let i;this.parts=[];let a=0,n=0;const r=t.length-1,l=this.parts,[u,p]=la(t,o);if(this.el=je.createElement(u,s),ce.currentNode=this.el.content,o===2||o===3){const f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(i=ce.nextNode())!==null&&l.length<r;){if(i.nodeType===1){if(i.hasAttributes())for(const f of i.getAttributeNames())if(f.endsWith(Xo)){const _=p[n++],g=i.getAttribute(f).split(te),x=/([.?@])?(.*)/.exec(_);l.push({type:1,index:a,name:x[2],strings:g,ctor:x[1]==="."?da:x[1]==="?"?ua:x[1]==="@"?ha:_t}),i.removeAttribute(f)}else f.startsWith(te)&&(l.push({type:6,index:a}),i.removeAttribute(f));if(is.test(i.tagName)){const f=i.textContent.split(te),_=f.length-1;if(_>0){i.textContent=gt?gt.emptyScript:"";for(let g=0;g<_;g++)i.append(f[g],Be()),ce.nextNode(),l.push({type:2,index:++a});i.append(f[_],Be())}}}else if(i.nodeType===8)if(i.data===Qo)l.push({type:2,index:a});else{let f=-1;for(;(f=i.data.indexOf(te,f+1))!==-1;)l.push({type:7,index:a}),f+=te.length-1}a++}}static createElement(t,o){const s=re.createElement("template");return s.innerHTML=t,s}}function xe(e,t,o=e,s){var n,r;if(t===j)return t;let i=s!==void 0?(n=o._$Co)==null?void 0:n[s]:o._$Cl;const a=Ie(t)?void 0:t._$litDirective$;return(i==null?void 0:i.constructor)!==a&&((r=i==null?void 0:i._$AO)==null||r.call(i,!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,o,s)),s!==void 0?(o._$Co??(o._$Co=[]))[s]=i:o._$Cl=i),i!==void 0&&(t=xe(e,i._$AS(e,t.values),i,s)),t}class ca{constructor(t,o){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=o}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:o},parts:s}=this._$AD,i=((t==null?void 0:t.creationScope)??re).importNode(o,!0);ce.currentNode=i;let a=ce.nextNode(),n=0,r=0,l=s[0];for(;l!==void 0;){if(n===l.index){let u;l.type===2?u=new Ne(a,a.nextSibling,this,t):l.type===1?u=new l.ctor(a,l.name,l.strings,this,t):l.type===6&&(u=new ma(a,this,t)),this._$AV.push(u),l=s[++r]}n!==(l==null?void 0:l.index)&&(a=ce.nextNode(),n++)}return ce.currentNode=re,i}p(t){let o=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,o),o+=s.strings.length-2):s._$AI(t[o])),o++}}class Ne{get _$AU(){var t;return((t=this._$AM)==null?void 0:t._$AU)??this._$Cv}constructor(t,o,s,i){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=o,this._$AM=s,this.options=i,this._$Cv=(i==null?void 0:i.isConnected)??!0}get parentNode(){let t=this._$AA.parentNode;const o=this._$AM;return o!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=o.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,o=this){t=xe(this,t,o),Ie(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==j&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):ra(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&Ie(this._$AH)?this._$AA.nextSibling.data=t:this.T(re.createTextNode(t)),this._$AH=t}$(t){var a;const{values:o,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=je.createElement(rs(s.h,s.h[0]),this.options)),s);if(((a=this._$AH)==null?void 0:a._$AD)===i)this._$AH.p(o);else{const n=new ca(i,this),r=n.u(this.options);n.p(o),this.T(r),this._$AH=n}}_$AC(t){let o=ns.get(t.strings);return o===void 0&&ns.set(t.strings,o=new je(t)),o}k(t){Jt(this._$AH)||(this._$AH=[],this._$AR());const o=this._$AH;let s,i=0;for(const a of t)i===o.length?o.push(s=new Ne(this.O(Be()),this.O(Be()),this,this.options)):s=o[i],s._$AI(a),i++;i<o.length&&(this._$AR(s&&s._$AB.nextSibling,i),o.length=i)}_$AR(t=this._$AA.nextSibling,o){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,o);t!==this._$AB;){const i=Yo(t).nextSibling;Yo(t).remove(),t=i}}setConnected(t){var o;this._$AM===void 0&&(this._$Cv=t,(o=this._$AP)==null||o.call(this,t))}}class _t{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,o,s,i,a){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=o,this._$AM=i,this.options=a,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=c}_$AI(t,o=this,s,i){const a=this.strings;let n=!1;if(a===void 0)t=xe(this,t,o,0),n=!Ie(t)||t!==this._$AH&&t!==j,n&&(this._$AH=t);else{const r=t;let l,u;for(t=a[0],l=0;l<a.length-1;l++)u=xe(this,r[s+l],o,l),u===j&&(u=this._$AH[l]),n||(n=!Ie(u)||u!==this._$AH[l]),u===c?t=c:t!==c&&(t+=(u??"")+a[l+1]),this._$AH[l]=u}n&&!i&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class da extends _t{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}}class ua extends _t{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}}class ha extends _t{constructor(t,o,s,i,a){super(t,o,s,i,a),this.type=5}_$AI(t,o=this){if((t=xe(this,t,o,0)??c)===j)return;const s=this._$AH,i=t===c&&s!==c||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,a=t!==c&&(s===c||i);i&&this.element.removeEventListener(this.name,this,s),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var o;typeof this._$AH=="function"?this._$AH.call(((o=this.options)==null?void 0:o.host)??this.element,t):this._$AH.handleEvent(t)}}class ma{constructor(t,o,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=o,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){xe(this,t)}}const Qt=Pe.litHtmlPolyfillSupport;Qt==null||Qt(je,Ne),(Pe.litHtmlVersions??(Pe.litHtmlVersions=[])).push("3.3.3");const pa=(e,t,o)=>{const s=(o==null?void 0:o.renderBefore)??t;let i=s._$litPart$;if(i===void 0){const a=(o==null?void 0:o.renderBefore)??null;s._$litPart$=i=new Ne(t.insertBefore(Be(),a),a,void 0,o??{})}return i._$AI(e),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const de=globalThis;let S=class extends $e{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var o;const t=super.createRenderRoot();return(o=this.renderOptions).renderBefore??(o.renderBefore=t.firstChild),t}update(t){const o=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=pa(o,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return j}};S._$litElement$=!0,S.finalized=!0,(Si=de.litElementHydrateSupport)==null||Si.call(de,{LitElement:S});const eo=de.litElementPolyfillSupport;eo==null||eo({LitElement:S}),(de.litElementVersions??(de.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const fa={attribute:!0,type:String,converter:bt,reflect:!1,hasChanged:Yt},ba=(e=fa,t,o)=>{const{kind:s,metadata:i}=o;let a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),s==="setter"&&((e=Object.create(e)).wrapped=!0),a.set(o.name,e),s==="accessor"){const{name:n}=o;return{set(r){const l=t.get.call(this);t.set.call(this,r),this.requestUpdate(n,l,e,!0,r)},init(r){return r!==void 0&&this.C(n,void 0,e,r),r}}}if(s==="setter"){const{name:n}=o;return function(r){const l=this[n];t.call(this,r),this.requestUpdate(n,l,e,!0,r)}}throw Error("Unsupported decorator location: "+s)};function m(e){return(t,o)=>typeof o=="object"?ba(e,t,o):((s,i,a)=>{const n=i.hasOwnProperty(a);return i.constructor.createProperty(a,s),n?Object.getOwnPropertyDescriptor(i,a):void 0})(e,t,o)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function D(e){return m({...e,state:!0,attribute:!1})}const ls=document.querySelector("home-assistant")&&!customElements.get("home-assistant")?customElements.whenDefined("home-assistant"):void 0,cs=(e,t)=>{customElements.get(e)||customElements.define(e,t)},L=e=>t=>{ls?ls.then(()=>cs(e,t)):cs(e,t)},ga=e=>{window.customCards=window.customCards||[],window.customCards.some(t=>t.type===e.type)||window.customCards.push(e)},Ae=270,ds=360-Ae/2-90,H=145,to=320,us=to/2,oo=H*2*Math.PI*Ae/360,vt=((e,t)=>{const o=e/180*Math.PI,s=t/180*Math.PI,i=s-o,a=H*Math.cos(o),n=H*Math.sin(o),r=H*Math.cos(s),l=H*Math.sin(s);return`M ${a} ${n} A ${H} ${H} 0 ${i>Math.PI?1:0} ${i>0?1:0} ${r} ${l}`})(0,Ae),so=(e,t,o)=>o===t?0:(e-t)/(o-t),yt=(e,t,o)=>so(e,t,o)*Ae,_a=(e,t,o,s)=>{const i=so(e,o,s),a=so(t,o,s),n=Math.max((a-i)*oo,0);return[`${n} ${oo-n}`,`-${i*oo-.5}`]},wt=(e,t,o,s)=>{const i=Math.round(e/s)*s;return Math.min(o,Math.max(t,Number(i.toFixed(4))))},va=(e,t,o)=>{if(!o.width)return 0;const s=2*(e-o.left-o.width/2)/o.width,i=2*(t-o.top-o.height/2)/o.height,a=Math.atan2(i,s)*180/Math.PI,n=(360-Ae)/2,r=(a+n-ds+360)%360-n;return Math.min(1,Math.max(0,r/Ae))},ya=(e,t,o,s)=>s?Math.abs(e-t)<=Math.abs(e-o)?"low":"high":"value",wa=(e,t,o,s)=>o?e<=t:s==="end"?t<=e:s==="start"?e<=t:!1;var ka=Object.defineProperty,$a=Object.getOwnPropertyDescriptor,O=(e,t,o,s)=>{for(var i=s>1?void 0:s?$a(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&ka(t,o,i),i};const hs=["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","Home","End"];let A=class extends S{constructor(){super(...arguments),this.min=5,this.max=35,this.step=.5,this.dual=!1,this.disabled=!1,this.mode="full",this.origin=0,this.inactive=!1,this.bound="low",this._gripTouch={handleEvent:e=>{this.disabled||e.preventDefault()},passive:!1}}willUpdate(e){e.has("value")&&this._active!=="value"&&(this._localValue=this.value),e.has("low")&&this._active!=="low"&&(this._localLow=this.low),e.has("high")&&this._active!=="high"&&(this._localHigh=this.high)}_valueFromEvent(e){var o;const t=(o=this._svg)==null?void 0:o.getBoundingClientRect();return t?this.min+va(e.clientX,e.clientY,t)*(this.max-this.min):this.min}_setActiveValue(e){const t=wt(e,this.min,this.max,this.step);this._active==="low"?this._localLow=Math.min(t,this._localHigh??this.max):this._active==="high"?this._localHigh=Math.max(t,this._localLow??this.min):this._localValue=t}_activeValue(){if(this._active==="low")return this._localLow;if(this._active==="high")return this._localHigh;if(this._active==="value")return this._localValue}_committedValue(){return this._active==="low"?this.low:this._active==="high"?this.high:this.value}_commit(){this._active&&(this._activeValue()!==this._committedValue()&&this._emit("changed"),this._active=void 0)}_emit(e){if(!this._active)return;const t=e==="changed"?this._activeValue():void 0;this.dispatchEvent(new CustomEvent(`${this._active}-${e}`,{detail:{value:t},bubbles:!0,composed:!0}))}_onPointerDown(e){if(this.disabled||this._active||e.pointerType==="touch")return;const t=this._valueFromEvent(e);this._active=ya(t,this._localLow??this.min,this._localHigh??this.max,this.dual),this._pointerId=e.pointerId,this._setActiveValue(t),e.currentTarget.setPointerCapture(e.pointerId),this._emit("changing")}_onGripDown(e,t){this.disabled||this._active||(this._active=t,this._pointerId=e.pointerId,e.currentTarget.setPointerCapture(e.pointerId),this._emit("changing"))}_onPointerMove(e){!this._active||e.pointerId!==this._pointerId||(this._setActiveValue(this._valueFromEvent(e)),this._emit("changing"))}_onPointerUp(e){!this._active||e.pointerId!==this._pointerId||(e.currentTarget.releasePointerCapture(e.pointerId),this._pointerId=void 0,this._commit())}_onPointerCancel(e){!this._active||e.pointerId!==this._pointerId||(this._pointerId=void 0,this._active==="low"?this._localLow=this.low:this._active==="high"?this._localHigh=this.high:this._localValue=this.value,this._active=void 0)}_onKeyDown(e){if(this.disabled||this._pointerId!==void 0||!hs.includes(e.code))return;e.preventDefault(),this._active||(this._active=this.dual?this.bound:"value");const t=this._activeValue()??this.min;switch(e.code){case"ArrowRight":case"ArrowUp":this._setActiveValue(t+this.step);break;case"ArrowLeft":case"ArrowDown":this._setActiveValue(t-this.step);break;case"Home":this._setActiveValue(this.min);break;case"End":this._setActiveValue(this.max);break}this._emit("changing")}_onKeyUp(e){this._pointerId!==void 0||!hs.includes(e.code)||this._commit()}_onBlur(){this._pointerId===void 0&&this._commit()}_fill(e,t,o,s=!1){const[i,a]=_a(e,t,this.min,this.max);return oe`
      <path
        class="fill ${o}${s?" active":""}"
        d=${vt}
        stroke-dasharray=${i}
        stroke-dashoffset=${a}
      />
    `}_originFill(e){const t=Math.min(this.max,Math.max(this.min,this.origin));return e===t?c:this._fill(Math.min(t,e),Math.max(t,e),"value")}_handle(e,t){return oe`
      <circle
        class="handle-ring ${t}"
        transform="rotate(${yt(e,this.min,this.max)} 0 0)"
        cx=${H}
        cy="0"
        r="12"
      />
      <circle
        class="handle"
        transform="rotate(${yt(e,this.min,this.max)} 0 0)"
        cx=${H}
        cy="0"
        r="9"
      />
    `}_grip(e,t){return oe`<circle
      class="grip ${t}"
      transform="rotate(${yt(e,this.min,this.max)} 0 0)"
      cx=${H}
      cy="0"
      r="24"
      @touchstart=${this._gripTouch}
      @pointerdown=${o=>this._onGripDown(o,t)}
      @pointermove=${this._onPointerMove}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerCancel}
    />`}_glass(){const e=(H-12)/(H+12);return oe`
      <defs>
        <radialGradient
          id="cgh-glass"
          gradientUnits="userSpaceOnUse"
          cx="0"
          cy="0"
          r=${H+12}
        >
          <stop offset=${e} stop-color="#fff" stop-opacity="0.09" />
          <stop offset=${e+.012} stop-color="#fff" stop-opacity="0" />
          <stop offset="0.91" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.96" stop-color="#fff" stop-opacity="0.1" />
          <stop offset="0.99" stop-color="#fff" stop-opacity="0.04" />
          <stop offset="1" stop-color="#fff" stop-opacity="0.09" />
        </radialGradient>
      </defs>
      <path class="glass" d=${vt} />
    `}_currentMarker(e){return oe`<circle
      class="current"
      transform="rotate(${yt(e,this.min,this.max)} 0 0)"
      cx=${H}
      cy="0"
      r="4"
    />`}render(){const e=this.current,t=e!=null&&e>=this.min&&e<=this.max,o=t&&!this.inactive,s=this.dual?this._localLow:this._localValue,i=this.dual?this._localHigh:void 0,a=o&&s!=null&&wa(e,s,this.dual,this.mode),n=o&&i!=null&&i<=e;return d`
      <svg
        viewBox="0 0 ${to} ${to}"
        class="slider"
        @keydown=${this._onKeyDown}
        @keyup=${this._onKeyUp}
        @blur=${this._onBlur}
        tabindex="0"
        role="slider"
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-valuenow=${(this.dual&&this.bound==="high"?i:s)??c}
        aria-disabled=${this.disabled}
      >
        <g
          class=${this.inactive?"inactive":""}
          transform="translate(${us} ${us}) rotate(${ds})"
        >
          <path class="track" d=${vt} />
          ${this.dual?oe`
                  ${s!=null?this._fill(this.min,s,"low"):c}
                  ${i!=null?this._fill(i,this.max,"high"):c}
                  ${a?this._fill(e,s,"low",!0):c}
                  ${n?this._fill(i,e,"high",!0):c}
                  ${this._glass()}
                  ${t?this._currentMarker(e):c}
                  ${s!=null?this._handle(s,"low"):c}
                  ${i!=null?this._handle(i,"high"):c}
                `:oe`
                  ${s!=null?this.mode==="end"?this._fill(s,this.max,"value"):this.mode==="full"?this._fill(this.min,this.max,"value"):this.mode==="origin"?this._originFill(s):this._fill(this.min,s,"value"):c}
                  ${a?this.mode==="end"?this._fill(s,e,"value",!0):this._fill(e,s,"value",!0):c}
                  ${this._glass()}
                  ${t?this._currentMarker(e):c}
                  ${s!=null?this._handle(s,"value"):c}
                `}
          <path
            class="interaction"
            d=${vt}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerCancel}
          />
          ${this.dual?oe`
                  ${s!=null?this._grip(s,"low"):c}
                  ${i!=null?this._grip(i,"high"):c}
                `:s!=null?this._grip(s,"value"):c}
        </g>
      </svg>
    `}firstUpdated(){this._svg=this.renderRoot.querySelector("svg")??void 0}};A.styles=C`
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
  `,O([m({type:Number})],A.prototype,"min",2),O([m({type:Number})],A.prototype,"max",2),O([m({type:Number})],A.prototype,"step",2),O([m({type:Number})],A.prototype,"value",2),O([m({type:Number})],A.prototype,"low",2),O([m({type:Number})],A.prototype,"high",2),O([m({type:Number})],A.prototype,"current",2),O([m({type:Boolean})],A.prototype,"dual",2),O([m({type:Boolean,reflect:!0})],A.prototype,"disabled",2),O([m({type:String})],A.prototype,"mode",2),O([m({type:Number})],A.prototype,"origin",2),O([m({type:Boolean,reflect:!0})],A.prototype,"inactive",2),O([m({type:String})],A.prototype,"bound",2),O([D()],A.prototype,"_localValue",2),O([D()],A.prototype,"_localLow",2),O([D()],A.prototype,"_localHigh",2),O([D()],A.prototype,"_active",2),A=O([L("cgh-circular-slider")],A);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ue={ATTRIBUTE:1,PROPERTY:3,BOOLEAN_ATTRIBUTE:4},ms=e=>(...t)=>({_$litDirective$:e,values:t});let ps=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,o,s){this._$Ct=t,this._$AM=o,this._$Ci=s}_$AS(t,o){return this.update(t,o)}update(t,o){return this.render(...o)}};/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const fs="important",xa=" !"+fs,he=ms(class extends ps{constructor(e){var t;if(super(e),e.type!==ue.ATTRIBUTE||e.name!=="style"||((t=e.strings)==null?void 0:t.length)>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,o)=>{const s=e[o];return s==null?t:t+`${o=o.includes("-")?o:o.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${s};`},"")}update(e,[t]){const{style:o}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(const s of this.ft)t[s]==null&&(this.ft.delete(s),s.includes("-")?o.removeProperty(s):o[s]=null);for(const s in t){const i=t[s];if(i!=null){this.ft.add(s);const a=typeof i=="string"&&i.endsWith(xa);s.includes("-")||a?o.setProperty(s,a?i.slice(0,-11):i,a?fs:""):o[s]=i}}return j}}),kt={en:{"action.cooling":"Cooling","action.drying":"Drying","action.fan":"Fan","action.heating":"Heating","action.idle":"Idle","action.off":"Off","block.presence":"Away","block.switch":"Main switch","block.switch_off":"Off","block.switch_release":"Manual control","block.switch_temperature":"Temperature","block.window":"Window open","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} until {time}","card.entity_not_found":"Entity not found: {entity}","card.history":"History","card.more_info":"More info","card.settings":"Settings","common.decrease":"Decrease","common.humidity":"Humidity","common.increase":"Increase","common.temperature":"Temperature","demo.group":"Demo group","demo.presence_sensor":"Resident","demo.room.bathroom":"Bathroom","demo.room.bedroom":"Bedroom","demo.room.kitchen":"Kitchen","demo.room.living_room":"Living room","demo.schedule":"Demo schedule","demo.slot":"Demo slot","demo.vacation":"Vacation","demo.window_sensor":"Window","editor.advanced_note":"Main switch, group offset, boost and reset need “Advanced Features”.","editor.battery":"Battery","editor.boost":"Boost button","editor.boost_absolute":"Absolute temperature","editor.boost_duration":"Duration","editor.boost_invalid":"Incomplete — the card shows no boost button.","editor.boost_relative":"Relative to the target","editor.control.buttons":"−/+ buttons","editor.control.slider":"Slider","editor.control.toggle":"View switch","editor.controls":"Controls","editor.custom_name":"Custom name","editor.demo":"Demo mode (synthetic data, no entity needed)","editor.deviations_badge":"Deviations badge","editor.features":"Feature tiles","editor.group_entity":"Group entity","editor.history":"History button","editor.header":"Header","editor.main_switch":"Main switch","editor.more_info":"More info button","editor.name":"Name","editor.offset":"Group offset","editor.reset":"Reset button","editor.section.badges":"Badges","editor.section.deviations":"Deviations","editor.section.panel":"Panel","editor.settings":"Settings button","editor.status_cell":"Status area","editor.title_placeholder":"Use the entity name","feature.calibration":"Calibration","feature.hold":"Hold","feature.isolation":"Isolation","feature.presence":"Presence","feature.schedule":"Schedule","feature.sync":"Sync","feature.window":"Window","humidity.target":"Humidity target","main_switch.label":"Main switch","member.details":"Show details of {name}","member.low_battery":"Low battery","member.unavailable":"Unavailable","mode.auto":"Auto","mode.cool":"Cool","mode.dry":"Dry","mode.fan_only":"Fan only","mode.heat":"Heat","mode.heat_cool":"Heat/Cool","mode.off":"Off","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass schedule","reset.fallback":"Schedule fallback","reset.label":"Reset","reset.offset":"Temperature offset","reset.presets":"Group presets","reset.schedule":"Main schedule","source.manual":"Manual","source.mirror":"Mirror","source.schedule":"Schedule","source.sync":"Sync","source.window":"Window","status.active":"Slot active","status.active_until":"Slot active until {time}","status.blocking_for":"for {duration}","status.device_unavailable":"{count} device unavailable","status.devices_unavailable":"{count} devices unavailable","status.setting_divergent":"{count} setting disagrees","status.settings_divergent":"{count} settings disagree","status.isolated":"{count} isolated","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} with low battery","status.next_at":"Next slot at {time}","status.next_slot":"Next slot: {title}","status.no_deviations":"No deviations","status.offset":"Offset {value}","status.oob":"{count} out of bounds","status.paused":"Paused by a slot or preset","status.remaining":"{duration} left","status.sensor_unavailable":"{count} sensor unavailable","status.sensors_unavailable":"{count} sensors unavailable","status.slot":"Slot: {title}","status.starts_at":"at {time}","status.until":"until {time}","status.via_service":"Service","tile.fan":"Fan mode","tile.mode":"Mode","tile.preset":"Preset","tile.swing":"Swing mode","tile.swing_horizontal":"Horizontal swing"},cs:{"action.cooling":"Chlazení","action.drying":"Odvlhčování","action.fan":"Ventilátor","action.heating":"Topení","action.idle":"Nečinný","action.off":"Vypnuto","block.presence":"Nepřítomen","block.switch":"Hlavní vypínač","block.switch_off":"Vypnuto","block.switch_release":"Ruční ovládání","block.switch_temperature":"Teplota","block.window":"Okno otevřeno","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} do {time}","card.entity_not_found":"Entita nenalezena: {entity}","card.history":"Historie","card.more_info":"Více informací","card.settings":"Nastavení","common.decrease":"Snížit","common.humidity":"Vlhkost","common.increase":"Zvýšit","common.temperature":"Teplota","demo.group":"Demo skupina","demo.presence_sensor":"Obyvatel","demo.room.bathroom":"Koupelna","demo.room.bedroom":"Ložnice","demo.room.kitchen":"Kuchyně","demo.room.living_room":"Obývací pokoj","demo.schedule":"Demo plán","demo.slot":"Demo úsek","demo.vacation":"Dovolená","demo.window_sensor":"Okno","editor.advanced_note":"Hlavní vypínač, offset skupiny, boost a obnovení vyžadují „Pokročilé funkce“.","editor.battery":"Baterie","editor.boost":"Tlačítko boostu","editor.boost_absolute":"Absolutní teplota","editor.boost_duration":"Doba trvání","editor.boost_invalid":"Neúplné — karta nezobrazí tlačítko boostu.","editor.boost_relative":"Relativně k cíli","editor.control.buttons":"Tlačítka −/+","editor.control.slider":"Posuvník","editor.control.toggle":"Přepínač zobrazení","editor.controls":"Ovládací prvky","editor.custom_name":"Vlastní název","editor.demo":"Režim ukázky (syntetická data, není potřeba entita)","editor.deviations_badge":"Odznak odchylek","editor.features":"Dlaždice funkcí","editor.group_entity":"Entita skupiny","editor.header":"Záhlaví","editor.history":"Tlačítko historie","editor.main_switch":"Hlavní vypínač","editor.more_info":"Tlačítko více informací","editor.name":"Název","editor.offset":"Offset skupiny","editor.reset":"Tlačítko obnovení","editor.section.badges":"Odznaky","editor.section.deviations":"Odchylky","editor.section.panel":"Panel","editor.settings":"Tlačítko nastavení","editor.status_cell":"Stavová oblast","editor.title_placeholder":"Použít název entity","feature.calibration":"Kalibrace","feature.hold":"Podržet","feature.isolation":"Izolace","feature.presence":"Přítomnost","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cílová vlhkost","main_switch.label":"Hlavní vypínač","member.details":"Zobrazit podrobnosti: {name}","member.low_battery":"Slabá baterie","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chlazení","mode.dry":"Odvlhčování","mode.fan_only":"Pouze ventilátor","mode.heat":"Topení","mode.heat_cool":"Topení/Chlazení","mode.off":"Vypnuto","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Obchozí plán","reset.fallback":"Náhradní plán","reset.label":"Obnovit","reset.offset":"Teplotní offset","reset.presets":"Předvolby skupiny","reset.schedule":"Hlavní plán","source.manual":"Ručně","source.mirror":"Zrcadlení","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Blok aktivní","status.active_until":"Blok aktivní do {time}","status.blocking_for":"už {duration}","status.device_unavailable":"{count} zařízení nedostupné","status.devices_unavailable":"Nedostupná zařízení: {count}","status.isolated":"{count} izolováno","status.layer_bypass":"Obchvat","status.layer_fallback":"Náhradní","status.low_battery":"{count} se slabou baterií","status.next_at":"Další blok od {time}","status.next_slot":"Další blok: {title}","status.no_deviations":"Žádné odchylky","status.offset":"Offset {value}","status.oob":"{count} mimo rozsah","status.paused":"Pozastaveno blokem nebo předvolbou","status.remaining":"zbývá {duration}","status.sensor_unavailable":"{count} senzor nedostupný","status.sensors_unavailable":"Nedostupné senzory: {count}","status.setting_divergent":"{count} nastavení se liší","status.settings_divergent":"Rozdílná nastavení: {count}","status.slot":"Blok: {title}","status.starts_at":"od {time}","status.until":"do {time}","status.via_service":"Služba","tile.fan":"Režim ventilátoru","tile.mode":"Režim","tile.preset":"Předvolba","tile.swing":"Režim natáčení","tile.swing_horizontal":"Vodorovné natáčení"},da:{"action.cooling":"Køler","action.drying":"Affugter","action.fan":"Ventilator","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Slukket","block.presence":"Ikke hjemme","block.switch":"Hovedafbryder","block.switch_off":"Slukket","block.switch_release":"Manuel styring","block.switch_temperature":"Temperatur","block.window":"Vindue åbent","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} til {time}","card.entity_not_found":"Enhed ikke fundet: {entity}","card.history":"Historik","card.more_info":"Mere info","card.settings":"Indstillinger","common.decrease":"Reducér","common.humidity":"Luftfugtighed","common.increase":"Forøg","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.presence_sensor":"Beboer","demo.room.bathroom":"Badeværelse","demo.room.bedroom":"Soveværelse","demo.room.kitchen":"Køkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrum","demo.vacation":"Ferie","demo.window_sensor":"Vindue","editor.advanced_note":"Hovedafbryder, gruppeforskydning, boost og nulstilling kræver „Avancerede funktioner“.","editor.battery":"Batteri","editor.boost":"Boost-knap","editor.boost_absolute":"Absolut temperatur","editor.boost_duration":"Varighed","editor.boost_invalid":"Ufuldstændig — kortet viser ingen boost-knap.","editor.boost_relative":"I forhold til målet","editor.control.buttons":"−/+-knapper","editor.control.slider":"Skyder","editor.control.toggle":"Skift visning","editor.controls":"Betjening","editor.custom_name":"Eget navn","editor.demo":"Demotilstand (syntetiske data, ingen enhed nødvendig)","editor.deviations_badge":"Afvigelsesmærke","editor.features":"Funktionsfelter","editor.group_entity":"Gruppeenhed","editor.header":"Sidehoved","editor.history":"Historikknap","editor.main_switch":"Hovedafbryder","editor.more_info":"Mere info-knap","editor.name":"Navn","editor.offset":"Gruppeforskydning","editor.reset":"Nulstillingsknap","editor.section.badges":"Mærkater","editor.section.deviations":"Afvigelser","editor.section.panel":"Panel","editor.settings":"Indstillingsknap","editor.status_cell":"Statusområde","editor.title_placeholder":"Brug enhedens navn","feature.calibration":"Kalibrering","feature.hold":"Hold","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindue","humidity.target":"Ønsket luftfugtighed","main_switch.label":"Hovedafbryder","member.details":"Vis detaljer for {name}","member.low_battery":"Lavt batteri","member.unavailable":"Utilgængelig","mode.auto":"Automatisk","mode.cool":"Køling","mode.dry":"Affugtning","mode.fan_only":"Kun ventilator","mode.heat":"Varme","mode.heat_cool":"Varme/Køling","mode.off":"Slukket","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-tidsplan","reset.fallback":"Tidsplan-fallback","reset.label":"Nulstil","reset.offset":"Temperaturforskydning","reset.presets":"Gruppeforudindstillinger","reset.schedule":"Hovedtidsplan","source.manual":"Manuel","source.mirror":"Spejling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindue","status.active":"Slot aktiv","status.active_until":"Slot aktiv til {time}","status.blocking_for":"i {duration}","status.device_unavailable":"{count} enhed utilgængelig","status.devices_unavailable":"{count} enheder utilgængelige","status.isolated":"{count} isoleret","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} med lavt batteri","status.next_at":"Næste slot fra {time}","status.next_slot":"Næste slot: {title}","status.no_deviations":"Ingen afvigelser","status.offset":"Offset {value}","status.oob":"{count} uden for området","status.paused":"Sat på pause af slot eller forudindstilling","status.remaining":"{duration} tilbage","status.sensor_unavailable":"{count} sensor utilgængelig","status.sensors_unavailable":"{count} sensorer utilgængelige","status.setting_divergent":"{count} indstilling afviger","status.settings_divergent":"{count} indstillinger afviger","status.slot":"Slot: {title}","status.starts_at":"fra {time}","status.until":"til {time}","status.via_service":"Tjeneste","tile.fan":"Ventilatortilstand","tile.mode":"Tilstand","tile.preset":"Forudindstilling","tile.swing":"Svingtilstand","tile.swing_horizontal":"Vandret sving"},de:{"action.cooling":"Kühlen","action.drying":"Trocknen","action.fan":"Lüfter","action.heating":"Heizen","action.idle":"Bereit","action.off":"Aus","block.presence":"Abwesend","block.switch":"Hauptschalter","block.switch_off":"Aus","block.switch_release":"Handbetrieb","block.switch_temperature":"Temperatur","block.window":"Fenster offen","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} bis {time}","card.entity_not_found":"Entität nicht gefunden: {entity}","card.history":"Verlauf","card.more_info":"Mehr Infos","card.settings":"Einstellungen","common.decrease":"Verringern","common.humidity":"Luftfeuchte","common.increase":"Erhöhen","common.temperature":"Temperatur","demo.group":"Demo-Gruppe","demo.presence_sensor":"Bewohner","demo.room.bathroom":"Bad","demo.room.bedroom":"Schlafzimmer","demo.room.kitchen":"Küche","demo.room.living_room":"Wohnzimmer","demo.schedule":"Demo-Zeitplan","demo.slot":"Demo-Zeitblock","demo.vacation":"Urlaub","demo.window_sensor":"Fenster","editor.advanced_note":"Hauptschalter, Gruppen-Offset, Boost und Reset brauchen „Erweiterte Funktionen“.","editor.battery":"Batterie","editor.boost":"Boost-Schaltfläche","editor.boost_absolute":"Absolute Temperatur","editor.boost_duration":"Dauer","editor.boost_invalid":"Unvollständig — die Karte zeigt keine Boost-Schaltfläche.","editor.boost_relative":"Relativ zum Ziel","editor.control.buttons":"−/+-Tasten","editor.control.slider":"Schieberegler","editor.control.toggle":"Ansichtsumschalter","editor.controls":"Bedienelemente","editor.custom_name":"Eigener Name","editor.demo":"Demo-Modus (synthetische Daten, keine Entität nötig)","editor.deviations_badge":"Abweichungs-Badge","editor.features":"Funktionskacheln","editor.group_entity":"Gruppen-Entität","editor.header":"Kopfzeile","editor.history":"Verlauf-Schaltfläche","editor.main_switch":"Hauptschalter","editor.more_info":"Mehr-Infos-Schaltfläche","editor.name":"Name","editor.offset":"Gruppen-Offset","editor.reset":"Reset-Schaltfläche","editor.section.badges":"Badges","editor.section.deviations":"Abweichungen","editor.section.panel":"Panel","editor.settings":"Einstellungen-Schaltfläche","editor.status_cell":"Statusbereich","editor.title_placeholder":"Entitätsname verwenden","feature.calibration":"Kalibrierung","feature.hold":"Halten","feature.isolation":"Isolation","feature.presence":"Präsenz","feature.schedule":"Zeitplan","feature.sync":"Sync","feature.window":"Fenster","humidity.target":"Feuchte-Sollwert","main_switch.label":"Hauptschalter","member.details":"Details zu {name} anzeigen","member.low_battery":"Batterie schwach","member.unavailable":"Nicht verfügbar","mode.auto":"Automatik","mode.cool":"Kühlen","mode.dry":"Trocknen","mode.fan_only":"Nur Lüfter","mode.heat":"Heizen","mode.heat_cool":"Heizen/Kühlen","mode.off":"Aus","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-Zeitplan","reset.fallback":"Zeitplan-Fallback","reset.label":"Zurücksetzen","reset.offset":"Temperatur-Offset","reset.presets":"Gruppen-Presets","reset.schedule":"Haupt-Zeitplan","source.manual":"Manuell","source.mirror":"Mirror","source.schedule":"Zeitplan","source.sync":"Sync","source.window":"Fenster","status.active":"Slot aktiv","status.active_until":"Slot aktiv bis {time}","status.blocking_for":"seit {duration}","status.device_unavailable":"{count} Gerät nicht verfügbar","status.devices_unavailable":"{count} Geräte nicht verfügbar","status.isolated":"{count} isoliert","status.layer_bypass":"Bypass","status.layer_fallback":"Fallback","status.low_battery":"{count} mit schwacher Batterie","status.next_at":"Nächster Slot ab {time}","status.next_slot":"Nächster Slot: {title}","status.no_deviations":"Keine Abweichungen","status.offset":"Offset {value}","status.oob":"{count} außerhalb des Bereichs","status.paused":"Durch Slot oder Preset pausiert","status.remaining":"noch {duration}","status.sensor_unavailable":"{count} Sensor nicht verfügbar","status.sensors_unavailable":"{count} Sensoren nicht verfügbar","status.setting_divergent":"{count} Einstellung uneinig","status.settings_divergent":"{count} Einstellungen uneinig","status.slot":"Slot: {title}","status.starts_at":"ab {time}","status.until":"bis {time}","status.via_service":"Dienst","tile.fan":"Lüftermodus","tile.mode":"Modus","tile.preset":"Preset","tile.swing":"Schwenkmodus","tile.swing_horizontal":"Horizontal schwenken"},el:{"action.cooling":"Ψύξη","action.drying":"Αφύγρανση","action.fan":"Ανεμιστήρας","action.heating":"Θέρμανση","action.idle":"Σε αδράνεια","action.off":"Ανενεργό","block.presence":"Εκτός σπιτιού","block.switch":"Κεντρικός διακόπτης","block.switch_off":"Ανενεργό","block.switch_release":"Χειροκίνητος έλεγχος","block.switch_temperature":"Θερμοκρασία","block.window":"Ανοιχτό παράθυρο","boost.duration":"{minutes} λεπτά","boost.label":"Boost","boost.running":"{temperature} έως {time}","card.entity_not_found":"Η οντότητα δεν βρέθηκε: {entity}","card.history":"Ιστορικό","card.more_info":"Περισσότερες πληροφορίες","card.settings":"Ρυθμίσεις","common.decrease":"Μείωση","common.humidity":"Υγρασία","common.increase":"Αύξηση","common.temperature":"Θερμοκρασία","demo.group":"Ομάδα επίδειξης","demo.presence_sensor":"Ένοικος","demo.room.bathroom":"Μπάνιο","demo.room.bedroom":"Υπνοδωμάτιο","demo.room.kitchen":"Κουζίνα","demo.room.living_room":"Σαλόνι","demo.schedule":"Πρόγραμμα επίδειξης","demo.slot":"Διάστημα επίδειξης","demo.vacation":"Διακοπές","demo.window_sensor":"Παράθυρο","editor.advanced_note":"Ο κεντρικός διακόπτης, η μετατόπιση ομάδας, το boost και η επαναφορά απαιτούν «Προηγμένες λειτουργίες».","editor.battery":"Μπαταρία","editor.boost":"Κουμπί boost","editor.boost_absolute":"Απόλυτη θερμοκρασία","editor.boost_duration":"Διάρκεια","editor.boost_invalid":"Ελλιπές — η κάρτα δεν εμφανίζει κουμπί boost.","editor.boost_relative":"Σχετικά με τον στόχο","editor.control.buttons":"Κουμπιά −/+","editor.control.slider":"Ρυθμιστικό","editor.control.toggle":"Εναλλαγή προβολής","editor.controls":"Χειριστήρια","editor.custom_name":"Προσαρμοσμένο όνομα","editor.demo":"Λειτουργία επίδειξης (συνθετικά δεδομένα, χωρίς οντότητα)","editor.deviations_badge":"Σήμα αποκλίσεων","editor.features":"Πλακίδια λειτουργιών","editor.group_entity":"Οντότητα ομάδας","editor.header":"Κεφαλίδα","editor.history":"Κουμπί ιστορικού","editor.main_switch":"Κεντρικός διακόπτης","editor.more_info":"Κουμπί περισσότερων πληροφοριών","editor.name":"Όνομα","editor.offset":"Μετατόπιση ομάδας","editor.reset":"Κουμπί επαναφοράς","editor.section.badges":"Σήματα","editor.section.deviations":"Αποκλίσεις","editor.section.panel":"Πάνελ","editor.settings":"Κουμπί ρυθμίσεων","editor.status_cell":"Περιοχή κατάστασης","editor.title_placeholder":"Χρήση του ονόματος της οντότητας","feature.calibration":"Βαθμονόμηση","feature.hold":"Διατήρηση","feature.isolation":"Απομόνωση","feature.presence":"Παρουσία","feature.schedule":"Πρόγραμμα","feature.sync":"Sync","feature.window":"Παράθυρο","humidity.target":"Υγρασία στόχου","main_switch.label":"Κεντρικός διακόπτης","member.details":"Εμφάνιση λεπτομερειών για {name}","member.low_battery":"Χαμηλή μπαταρία","member.unavailable":"Μη διαθέσιμο","mode.auto":"Αυτόματο","mode.cool":"Ψύξη","mode.dry":"Αφύγρανση","mode.fan_only":"Μόνο ανεμιστήρας","mode.heat":"Θέρμανση","mode.heat_cool":"Θέρμανση/Ψύξη","mode.off":"Ανενεργό","offset.label":"Μετατόπιση","reset.boost":"Boost","reset.bypass":"Πρόγραμμα εξαίρεσης","reset.fallback":"Εναλλακτική κατάσταση προγράμματος","reset.label":"Επαναφορά","reset.offset":"Μετατόπιση θερμοκρασίας","reset.presets":"Προρυθμίσεις ομάδας","reset.schedule":"Κύριο πρόγραμμα","source.manual":"Χειροκίνητα","source.mirror":"Κατοπτρισμός","source.schedule":"Πρόγραμμα","source.sync":"Sync","source.window":"Παράθυρο","status.active":"Ενεργό διάστημα","status.active_until":"Ενεργό διάστημα έως {time}","status.blocking_for":"εδώ και {duration}","status.device_unavailable":"{count} συσκευή μη διαθέσιμη","status.devices_unavailable":"{count} συσκευές μη διαθέσιμες","status.isolated":"{count} απομονωμένα","status.layer_bypass":"Εξαίρεση","status.layer_fallback":"Εναλλακτικό","status.low_battery":"{count} με χαμηλή μπαταρία","status.next_at":"Επόμενο διάστημα στις {time}","status.next_slot":"Επόμενο διάστημα: {title}","status.no_deviations":"Χωρίς αποκλίσεις","status.offset":"Μετατόπιση {value}","status.oob":"{count} εκτός ορίων","status.paused":"Σε παύση από διάστημα ή προρύθμιση","status.remaining":"απομένουν {duration}","status.sensor_unavailable":"{count} αισθητήρας μη διαθέσιμος","status.sensors_unavailable":"{count} αισθητήρες μη διαθέσιμοι","status.setting_divergent":"{count} ρύθμιση διαφέρει","status.settings_divergent":"{count} ρυθμίσεις διαφέρουν","status.slot":"Διάστημα: {title}","status.starts_at":"στις {time}","status.until":"έως {time}","status.via_service":"Υπηρεσία","tile.fan":"Λειτουργία ανεμιστήρα","tile.mode":"Λειτουργία","tile.preset":"Προρύθμιση","tile.swing":"Λειτουργία ταλάντευσης","tile.swing_horizontal":"Οριζόντια ταλάντευση"},es:{"action.cooling":"Enfriando","action.drying":"Deshumidificando","action.fan":"Ventilador","action.heating":"Calentando","action.idle":"Inactivo","action.off":"Apagado","block.presence":"Ausente","block.switch":"Interruptor principal","block.switch_off":"Apagado","block.switch_release":"Control manual","block.switch_temperature":"Temperatura","block.window":"Ventana abierta","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} hasta las {time}","card.entity_not_found":"Entidad no encontrada: {entity}","card.history":"Historial","card.more_info":"Más información","card.settings":"Configuración","common.decrease":"Disminuir","common.humidity":"Humedad","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demostración","demo.presence_sensor":"Residente","demo.room.bathroom":"Baño","demo.room.bedroom":"Dormitorio","demo.room.kitchen":"Cocina","demo.room.living_room":"Salón","demo.schedule":"Programación de demostración","demo.slot":"Franja de demostración","demo.vacation":"Vacaciones","demo.window_sensor":"Ventana","editor.advanced_note":"Interruptor principal, desplazamiento del grupo, boost y restablecimiento requieren «Funciones avanzadas».","editor.battery":"Batería","editor.boost":"Botón de boost","editor.boost_absolute":"Temperatura absoluta","editor.boost_duration":"Duración","editor.boost_invalid":"Incompleto — la tarjeta no muestra el botón de boost.","editor.boost_relative":"Relativo al objetivo","editor.control.buttons":"Botones −/+","editor.control.slider":"Control deslizante","editor.control.toggle":"Selector de vista","editor.controls":"Controles","editor.custom_name":"Nombre personalizado","editor.demo":"Modo demo (datos sintéticos, no se necesita entidad)","editor.deviations_badge":"Insignia de desviaciones","editor.features":"Mosaicos de funciones","editor.group_entity":"Entidad del grupo","editor.header":"Encabezado","editor.history":"Botón de historial","editor.main_switch":"Interruptor principal","editor.more_info":"Botón de más información","editor.name":"Nombre","editor.offset":"Desplazamiento del grupo","editor.reset":"Botón de restablecer","editor.section.badges":"Insignias","editor.section.deviations":"Desviaciones","editor.section.panel":"Panel","editor.settings":"Botón de configuración","editor.status_cell":"Área de estado","editor.title_placeholder":"Usar el nombre de la entidad","feature.calibration":"Calibración","feature.hold":"Mantener","feature.isolation":"Aislamiento","feature.presence":"Presencia","feature.schedule":"Programación","feature.sync":"Sync","feature.window":"Ventana","humidity.target":"Humedad objetivo","main_switch.label":"Interruptor principal","member.details":"Mostrar detalles de {name}","member.low_battery":"Batería baja","member.unavailable":"No disponible","mode.auto":"Automático","mode.cool":"Frío","mode.dry":"Seco","mode.fan_only":"Solo ventilador","mode.heat":"Calor","mode.heat_cool":"Calor/Frío","mode.off":"Apagado","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Programación de anulación","reset.fallback":"Reserva de la programación","reset.label":"Restablecer","reset.offset":"Desplazamiento de temperatura","reset.presets":"Preajustes de grupo","reset.schedule":"Programación principal","source.manual":"Manual","source.mirror":"Espejo","source.schedule":"Programación","source.sync":"Sync","source.window":"Ventana","status.active":"Franja activa","status.active_until":"Franja activa hasta {time}","status.blocking_for":"desde hace {duration}","status.device_unavailable":"{count} dispositivo no disponible","status.devices_unavailable":"{count} dispositivos no disponibles","status.isolated":"{count} aislado","status.layer_bypass":"Anulación","status.layer_fallback":"Reserva","status.low_battery":"{count} con batería baja","status.next_at":"Siguiente franja desde {time}","status.next_slot":"Siguiente franja: {title}","status.no_deviations":"Sin desviaciones","status.offset":"Offset {value}","status.oob":"{count} fuera de rango","status.paused":"En pausa por una franja o un preajuste","status.remaining":"quedan {duration}","status.sensor_unavailable":"{count} sensor no disponible","status.sensors_unavailable":"{count} sensores no disponibles","status.setting_divergent":"{count} ajuste no coincide","status.settings_divergent":"{count} ajustes no coinciden","status.slot":"Franja: {title}","status.starts_at":"desde {time}","status.until":"hasta {time}","status.via_service":"Servicio","tile.fan":"Modo de ventilador","tile.mode":"Modo","tile.preset":"Preajuste","tile.swing":"Modo de oscilación","tile.swing_horizontal":"Oscilación horizontal"},fi:{"action.cooling":"Jäähdyttää","action.drying":"Kuivattaa","action.fan":"Puhallin","action.heating":"Lämmittää","action.idle":"Odottaa","action.off":"Pois","block.presence":"Poissa","block.switch":"Pääkytkin","block.switch_off":"Pois","block.switch_release":"Käsiohjaus","block.switch_temperature":"Lämpötila","block.window":"Ikkuna auki","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} klo {time} asti","card.entity_not_found":"Entiteettiä ei löytynyt: {entity}","card.history":"Historia","card.more_info":"Lisätietoja","card.settings":"Asetukset","common.decrease":"Vähennä","common.humidity":"Kosteus","common.increase":"Lisää","common.temperature":"Lämpötila","demo.group":"Demoryhmä","demo.presence_sensor":"Asukas","demo.room.bathroom":"Kylpyhuone","demo.room.bedroom":"Makuuhuone","demo.room.kitchen":"Keittiö","demo.room.living_room":"Olohuone","demo.schedule":"Demoaikataulu","demo.slot":"Demojakso","demo.vacation":"Loma","demo.window_sensor":"Ikkuna","editor.advanced_note":"Pääkytkin, ryhmän siirtymä, boost ja palautus vaativat ”Lisäominaisuudet”.","editor.battery":"Akku","editor.boost":"Boost-painike","editor.boost_absolute":"Absoluuttinen lämpötila","editor.boost_duration":"Kesto","editor.boost_invalid":"Puutteellinen — kortti ei näytä boost-painiketta.","editor.boost_relative":"Suhteessa tavoitteeseen","editor.control.buttons":"−/+-painikkeet","editor.control.slider":"Liukusäädin","editor.control.toggle":"Näkymän valitsin","editor.controls":"Säätimet","editor.custom_name":"Oma nimi","editor.demo":"Esittelytila (synteettinen data, entiteettiä ei tarvita)","editor.deviations_badge":"Poikkeamamerkki","editor.features":"Toimintoruudut","editor.group_entity":"Ryhmän entiteetti","editor.header":"Ylätunniste","editor.history":"Historiapainike","editor.main_switch":"Pääkytkin","editor.more_info":"Lisätietopainike","editor.name":"Nimi","editor.offset":"Ryhmän siirtymä","editor.reset":"Palautuspainike","editor.section.badges":"Merkit","editor.section.deviations":"Poikkeamat","editor.section.panel":"Paneeli","editor.settings":"Asetuspainike","editor.status_cell":"Tila-alue","editor.title_placeholder":"Käytä entiteetin nimeä","feature.calibration":"Kalibrointi","feature.hold":"Pito","feature.isolation":"Eristys","feature.presence":"Läsnäolo","feature.schedule":"Aikataulu","feature.sync":"Sync","feature.window":"Ikkuna","humidity.target":"Kosteuden tavoite","main_switch.label":"Pääkytkin","member.details":"Näytä laitteen {name} tiedot","member.low_battery":"Akku vähissä","member.unavailable":"Ei saatavilla","mode.auto":"Automaattinen","mode.cool":"Jäähdytys","mode.dry":"Kuivaus","mode.fan_only":"Vain puhallin","mode.heat":"Lämmitys","mode.heat_cool":"Lämmitys/Jäähdytys","mode.off":"Pois","offset.label":"Siirtymä","reset.boost":"Boost","reset.bypass":"Ohitusaikataulu","reset.fallback":"Aikataulun varatila","reset.label":"Palauta","reset.offset":"Lämpötilan siirtymä","reset.presets":"Ryhmän esiasetukset","reset.schedule":"Pääaikataulu","source.manual":"Manuaalinen","source.mirror":"Peilaus","source.schedule":"Aikataulu","source.sync":"Sync","source.window":"Ikkuna","status.active":"Jakso käynnissä","status.active_until":"Jakso käynnissä {time} asti","status.blocking_for":"jo {duration}","status.device_unavailable":"{count} laite ei käytettävissä","status.devices_unavailable":"{count} laitetta ei käytettävissä","status.isolated":"{count} eristetty","status.layer_bypass":"Ohitus","status.layer_fallback":"Varatila","status.low_battery":"Akku vähissä: {count}","status.next_at":"Seuraava jakso alkaa {time}","status.next_slot":"Seuraava jakso: {title}","status.no_deviations":"Ei poikkeamia","status.offset":"Siirtymä {value}","status.oob":"{count} rajojen ulkopuolella","status.paused":"Keskeytetty jakson tai esiasetuksen vuoksi","status.remaining":"{duration} jäljellä","status.sensor_unavailable":"{count} anturi ei käytettävissä","status.sensors_unavailable":"{count} anturia ei käytettävissä","status.setting_divergent":"{count} asetus poikkeaa","status.settings_divergent":"{count} asetusta poikkeaa","status.slot":"Jakso: {title}","status.starts_at":"alkaa {time}","status.until":"{time} asti","status.via_service":"Palvelu","tile.fan":"Puhallintila","tile.mode":"Tila","tile.preset":"Esiasetus","tile.swing":"Kääntötila","tile.swing_horizontal":"Vaakakääntö"},fr:{"action.cooling":"Refroidissement","action.drying":"Déshumidification","action.fan":"Ventilation","action.heating":"Chauffage","action.idle":"Inactif","action.off":"Éteint","block.presence":"Absent","block.switch":"Interrupteur principal","block.switch_off":"Éteint","block.switch_release":"Contrôle manuel","block.switch_temperature":"Température","block.window":"Fenêtre ouverte","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} jusqu’à {time}","card.entity_not_found":"Entité introuvable : {entity}","card.history":"Historique","card.more_info":"Plus d'infos","card.settings":"Paramètres","common.decrease":"Diminuer","common.humidity":"Humidité","common.increase":"Augmenter","common.temperature":"Température","demo.group":"Groupe de démo","demo.presence_sensor":"Résident","demo.room.bathroom":"Salle de bain","demo.room.bedroom":"Chambre","demo.room.kitchen":"Cuisine","demo.room.living_room":"Salon","demo.schedule":"Planification de démo","demo.slot":"Créneau de démo","demo.vacation":"Vacances","demo.window_sensor":"Fenêtre","editor.advanced_note":"Interrupteur principal, décalage du groupe, boost et réinitialisation nécessitent « Fonctions avancées ».","editor.battery":"Batterie","editor.boost":"Bouton de boost","editor.boost_absolute":"Température absolue","editor.boost_duration":"Durée","editor.boost_invalid":"Incomplet — la carte n’affiche pas de bouton de boost.","editor.boost_relative":"Relatif à la cible","editor.control.buttons":"Boutons −/+","editor.control.slider":"Curseur","editor.control.toggle":"Bascule de vue","editor.controls":"Commandes","editor.custom_name":"Nom personnalisé","editor.demo":"Mode démo (données synthétiques, aucune entité requise)","editor.deviations_badge":"Badge des écarts","editor.features":"Tuiles de fonctions","editor.group_entity":"Entité du groupe","editor.header":"En-tête","editor.history":"Bouton d'historique","editor.main_switch":"Interrupteur principal","editor.more_info":"Bouton d'informations","editor.name":"Nom","editor.offset":"Décalage du groupe","editor.reset":"Bouton de réinitialisation","editor.section.badges":"Badges","editor.section.deviations":"Écarts","editor.section.panel":"Panneau","editor.settings":"Bouton des paramètres","editor.status_cell":"Zone d'état","editor.title_placeholder":"Utiliser le nom de l'entité","feature.calibration":"Calibration","feature.hold":"Maintien","feature.isolation":"Isolation","feature.presence":"Présence","feature.schedule":"Planification","feature.sync":"Sync","feature.window":"Fenêtre","humidity.target":"Humidité cible","main_switch.label":"Interrupteur principal","member.details":"Afficher les détails de {name}","member.low_battery":"Batterie faible","member.unavailable":"Indisponible","mode.auto":"Automatique","mode.cool":"Froid","mode.dry":"Sec","mode.fan_only":"Ventilation seule","mode.heat":"Chauffage","mode.heat_cool":"Chauffage/Froid","mode.off":"Éteint","offset.label":"Décalage","reset.boost":"Boost","reset.bypass":"Planification de contournement","reset.fallback":"Secours de la planification","reset.label":"Réinitialiser","reset.offset":"Décalage de température","reset.presets":"Préréglages de groupe","reset.schedule":"Planification principale","source.manual":"Manuel","source.mirror":"Miroir","source.schedule":"Planification","source.sync":"Sync","source.window":"Fenêtre","status.active":"Créneau actif","status.active_until":"Créneau actif jusqu’à {time}","status.blocking_for":"depuis {duration}","status.device_unavailable":"{count} appareil indisponible","status.devices_unavailable":"{count} appareils indisponibles","status.isolated":"{count} isolé","status.layer_bypass":"Contournement","status.layer_fallback":"Secours","status.low_battery":"{count} avec batterie faible","status.next_at":"Prochain créneau dès {time}","status.next_slot":"Prochain créneau : {title}","status.no_deviations":"Aucun écart","status.offset":"Décalage {value}","status.oob":"{count} hors limites","status.paused":"En pause par un créneau ou un préréglage","status.remaining":"encore {duration}","status.sensor_unavailable":"{count} capteur indisponible","status.sensors_unavailable":"{count} capteurs indisponibles","status.setting_divergent":"{count} réglage divergent","status.settings_divergent":"{count} réglages divergents","status.slot":"Créneau : {title}","status.starts_at":"dès {time}","status.until":"jusqu’à {time}","status.via_service":"Service","tile.fan":"Mode ventilation","tile.mode":"Mode","tile.preset":"Préréglage","tile.swing":"Mode oscillation","tile.swing_horizontal":"Oscillation horizontale"},hu:{"action.cooling":"Hűtés","action.drying":"Párátlanítás","action.fan":"Ventilátor","action.heating":"Fűtés","action.idle":"Tétlen","action.off":"Ki","block.presence":"Távol","block.switch":"Főkapcsoló","block.switch_off":"Ki","block.switch_release":"Kézi vezérlés","block.switch_temperature":"Hőmérséklet","block.window":"Ablak nyitva","boost.duration":"{minutes} perc","boost.label":"Boost","boost.running":"{temperature} {time}-ig","card.entity_not_found":"Az entitás nem található: {entity}","card.history":"Előzmények","card.more_info":"További információ","card.settings":"Beállítások","common.decrease":"Csökkentés","common.humidity":"Páratartalom","common.increase":"Növelés","common.temperature":"Hőmérséklet","demo.group":"Bemutató csoport","demo.presence_sensor":"Lakó","demo.room.bathroom":"Fürdőszoba","demo.room.bedroom":"Hálószoba","demo.room.kitchen":"Konyha","demo.room.living_room":"Nappali","demo.schedule":"Bemutató ütemezés","demo.slot":"Bemutató idősáv","demo.vacation":"Szabadság","demo.window_sensor":"Ablak","editor.advanced_note":"A főkapcsolóhoz, a csoporteltoláshoz, a boosthoz és a visszaállításhoz „Speciális funkciók” szükségesek.","editor.battery":"Akkumulátor","editor.boost":"Boost gomb","editor.boost_absolute":"Abszolút hőmérséklet","editor.boost_duration":"Időtartam","editor.boost_invalid":"Hiányos — a kártya nem mutat boost gombot.","editor.boost_relative":"A célhoz képest","editor.control.buttons":"−/+ gombok","editor.control.slider":"Csúszka","editor.control.toggle":"Nézetváltó","editor.controls":"Vezérlők","editor.custom_name":"Egyéni név","editor.demo":"Bemutató mód (szintetikus adatok, nincs szükség entitásra)","editor.deviations_badge":"Eltérések jelvény","editor.features":"Funkciócsempék","editor.group_entity":"Csoport entitás","editor.header":"Fejléc","editor.history":"Előzmények gomb","editor.main_switch":"Főkapcsoló","editor.more_info":"További információ gomb","editor.name":"Név","editor.offset":"Csoporteltolás","editor.reset":"Visszaállítás gomb","editor.section.badges":"Jelvények","editor.section.deviations":"Eltérések","editor.section.panel":"Panel","editor.settings":"Beállítások gomb","editor.status_cell":"Állapotterület","editor.title_placeholder":"Az entitás nevének használata","feature.calibration":"Kalibráció","feature.hold":"Tartás","feature.isolation":"Elkülönítés","feature.presence":"Jelenlét","feature.schedule":"Ütemezés","feature.sync":"Sync","feature.window":"Ablak","humidity.target":"Cél páratartalom","main_switch.label":"Főkapcsoló","member.details":"{name} részleteinek megjelenítése","member.low_battery":"Alacsony akkumulátor","member.unavailable":"Nem elérhető","mode.auto":"Automatikus","mode.cool":"Hűtés","mode.dry":"Párátlanítás","mode.fan_only":"Csak ventilátor","mode.heat":"Fűtés","mode.heat_cool":"Fűtés/Hűtés","mode.off":"Ki","offset.label":"Eltolás","reset.boost":"Boost","reset.bypass":"Kivételütemezés","reset.fallback":"Ütemezés tartalék állapota","reset.label":"Visszaállítás","reset.offset":"Hőmérséklet-eltolás","reset.presets":"Csoportprofilok","reset.schedule":"Fő ütemezés","source.manual":"Kézi","source.mirror":"Tükrözés","source.schedule":"Ütemezés","source.sync":"Sync","source.window":"Ablak","status.active":"Idősáv aktív","status.active_until":"Idősáv aktív {time}-ig","status.blocking_for":"{duration} óta","status.device_unavailable":"{count} eszköz nem elérhető","status.devices_unavailable":"{count} eszköz nem elérhető","status.isolated":"{count} elkülönítve","status.layer_bypass":"Kivétel","status.layer_fallback":"Tartalék","status.low_battery":"{count} alacsony akkumulátorral","status.next_at":"Következő idősáv {time}-kor","status.next_slot":"Következő idősáv: {title}","status.no_deviations":"Nincs eltérés","status.offset":"Eltolás {value}","status.oob":"{count} tartományon kívül","status.paused":"Egy idősáv vagy profil szüneteltette","status.remaining":"még {duration}","status.sensor_unavailable":"{count} érzékelő nem elérhető","status.sensors_unavailable":"{count} érzékelő nem elérhető","status.setting_divergent":"{count} beállítás eltér","status.settings_divergent":"{count} beállítás eltér","status.slot":"Idősáv: {title}","status.starts_at":"{time}-kor","status.until":"{time}-ig","status.via_service":"Szolgáltatás","tile.fan":"Ventilátor mód","tile.mode":"Mód","tile.preset":"Profil","tile.swing":"Legyezés mód","tile.swing_horizontal":"Vízszintes legyezés"},it:{"action.cooling":"Raffreddamento","action.drying":"Deumidificazione","action.fan":"Ventola","action.heating":"Riscaldamento","action.idle":"Inattivo","action.off":"Spento","block.presence":"Assente","block.switch":"Interruttore principale","block.switch_off":"Spento","block.switch_release":"Controllo manuale","block.switch_temperature":"Temperatura","block.window":"Finestra aperta","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} fino alle {time}","card.entity_not_found":"Entità non trovata: {entity}","card.history":"Cronologia","card.more_info":"Altre info","card.settings":"Impostazioni","common.decrease":"Diminuisci","common.humidity":"Umidità","common.increase":"Aumenta","common.temperature":"Temperatura","demo.group":"Gruppo demo","demo.presence_sensor":"Residente","demo.room.bathroom":"Bagno","demo.room.bedroom":"Camera da letto","demo.room.kitchen":"Cucina","demo.room.living_room":"Soggiorno","demo.schedule":"Pianificazione demo","demo.slot":"Fascia demo","demo.vacation":"Vacanza","demo.window_sensor":"Finestra","editor.advanced_note":"Interruttore principale, offset del gruppo, boost e ripristino richiedono «Funzioni avanzate».","editor.battery":"Batteria","editor.boost":"Pulsante boost","editor.boost_absolute":"Temperatura assoluta","editor.boost_duration":"Durata","editor.boost_invalid":"Incompleto — la scheda non mostra il pulsante boost.","editor.boost_relative":"Relativo all’obiettivo","editor.control.buttons":"Pulsanti −/+","editor.control.slider":"Cursore","editor.control.toggle":"Selettore vista","editor.controls":"Controlli","editor.custom_name":"Nome personalizzato","editor.demo":"Modalità demo (dati sintetici, nessuna entità necessaria)","editor.deviations_badge":"Badge scostamenti","editor.features":"Riquadri funzioni","editor.group_entity":"Entità del gruppo","editor.header":"Intestazione","editor.history":"Pulsante cronologia","editor.main_switch":"Interruttore principale","editor.more_info":"Pulsante altre info","editor.name":"Nome","editor.offset":"Offset del gruppo","editor.reset":"Pulsante di ripristino","editor.section.badges":"Badge","editor.section.deviations":"Scostamenti","editor.section.panel":"Pannello","editor.settings":"Pulsante impostazioni","editor.status_cell":"Area di stato","editor.title_placeholder":"Usa il nome dell'entità","feature.calibration":"Calibrazione","feature.hold":"Mantieni","feature.isolation":"Isolamento","feature.presence":"Presenza","feature.schedule":"Pianificazione","feature.sync":"Sync","feature.window":"Finestra","humidity.target":"Umidità target","main_switch.label":"Interruttore principale","member.details":"Mostra dettagli di {name}","member.low_battery":"Batteria scarica","member.unavailable":"Non disponibile","mode.auto":"Automatico","mode.cool":"Raffreddamento","mode.dry":"Deumidificazione","mode.fan_only":"Solo ventola","mode.heat":"Riscaldamento","mode.heat_cool":"Riscaldamento/Raffreddamento","mode.off":"Spento","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Pianificazione di bypass","reset.fallback":"Riserva della pianificazione","reset.label":"Ripristina","reset.offset":"Offset temperatura","reset.presets":"Preimpostazioni di gruppo","reset.schedule":"Pianificazione principale","source.manual":"Manuale","source.mirror":"Mirror","source.schedule":"Pianificazione","source.sync":"Sync","source.window":"Finestra","status.active":"Fascia attiva","status.active_until":"Fascia attiva fino a {time}","status.blocking_for":"da {duration}","status.device_unavailable":"{count} dispositivo non disponibile","status.devices_unavailable":"{count} dispositivi non disponibili","status.isolated":"{count} isolato","status.layer_bypass":"Bypass","status.layer_fallback":"Riserva","status.low_battery":"{count} con batteria scarica","status.next_at":"Prossima fascia da {time}","status.next_slot":"Prossima fascia: {title}","status.no_deviations":"Nessuno scostamento","status.offset":"Offset {value}","status.oob":"{count} fuori intervallo","status.paused":"In pausa per una fascia o un preset","status.remaining":"ancora {duration}","status.sensor_unavailable":"{count} sensore non disponibile","status.sensors_unavailable":"{count} sensori non disponibili","status.setting_divergent":"{count} impostazione non coincide","status.settings_divergent":"{count} impostazioni non coincidono","status.slot":"Fascia: {title}","status.starts_at":"da {time}","status.until":"fino a {time}","status.via_service":"Servizio","tile.fan":"Modalità ventola","tile.mode":"Modalità","tile.preset":"Preset","tile.swing":"Modalità oscillazione","tile.swing_horizontal":"Oscillazione orizzontale"},nb:{"action.cooling":"Kjøler","action.drying":"Avfukter","action.fan":"Vifte","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borte","block.switch":"Hovedbryter","block.switch_off":"Av","block.switch_release":"Manuell styring","block.switch_temperature":"Temperatur","block.window":"Vindu åpent","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} til {time}","card.entity_not_found":"Enhet ikke funnet: {entity}","card.history":"Historikk","card.more_info":"Mer info","card.settings":"Innstillinger","common.decrease":"Reduser","common.humidity":"Luftfuktighet","common.increase":"Øk","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.presence_sensor":"Beboer","demo.room.bathroom":"Bad","demo.room.bedroom":"Soverom","demo.room.kitchen":"Kjøkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrom","demo.vacation":"Ferie","demo.window_sensor":"Vindu","editor.advanced_note":"Hovedbryter, gruppeforskyvning, boost og tilbakestilling krever «Avanserte funksjoner».","editor.battery":"Batteri","editor.boost":"Boost-knapp","editor.boost_absolute":"Absolutt temperatur","editor.boost_duration":"Varighet","editor.boost_invalid":"Ufullstendig — kortet viser ingen boost-knapp.","editor.boost_relative":"Relativt til målet","editor.control.buttons":"−/+-knapper","editor.control.slider":"Glidebryter","editor.control.toggle":"Visningsbryter","editor.controls":"Kontroller","editor.custom_name":"Eget navn","editor.demo":"Demomodus (syntetiske data, ingen enhet nødvendig)","editor.deviations_badge":"Avviksmerke","editor.features":"Funksjonsfliser","editor.group_entity":"Gruppeenhet","editor.header":"Topptekst","editor.history":"Historikkknapp","editor.main_switch":"Hovedbryter","editor.more_info":"Mer info-knapp","editor.name":"Navn","editor.offset":"Gruppeforskyvning","editor.reset":"Tilbakestillingsknapp","editor.section.badges":"Merker","editor.section.deviations":"Avvik","editor.section.panel":"Panel","editor.settings":"Innstillingsknapp","editor.status_cell":"Statusområde","editor.title_placeholder":"Bruk enhetsnavnet","feature.calibration":"Kalibrering","feature.hold":"Hold","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindu","humidity.target":"Ønsket luftfuktighet","main_switch.label":"Hovedbryter","member.details":"Vis detaljer for {name}","member.low_battery":"Lavt batteri","member.unavailable":"Utilgjengelig","mode.auto":"Automatisk","mode.cool":"Kjøling","mode.dry":"Avfukting","mode.fan_only":"Kun vifte","mode.heat":"Varme","mode.heat_cool":"Varme/Kjøling","mode.off":"Av","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Omgåelsestidsplan","reset.fallback":"Reserve for tidsplan","reset.label":"Tilbakestill","reset.offset":"Temperaturforskyvning","reset.presets":"Gruppeforhåndsinnstillinger","reset.schedule":"Hovedtidsplan","source.manual":"Manuell","source.mirror":"Speiling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindu","status.active":"Slot aktiv","status.active_until":"Slot aktiv til {time}","status.blocking_for":"i {duration}","status.device_unavailable":"{count} enhet utilgjengelig","status.devices_unavailable":"{count} enheter utilgjengelige","status.isolated":"{count} isolert","status.layer_bypass":"Omgåelse","status.layer_fallback":"Reserve","status.low_battery":"{count} med lavt batteri","status.next_at":"Neste slot fra {time}","status.next_slot":"Neste slot: {title}","status.no_deviations":"Ingen avvik","status.offset":"Offset {value}","status.oob":"{count} utenfor området","status.paused":"Satt på pause av slot eller forhåndsinnstilling","status.remaining":"{duration} igjen","status.sensor_unavailable":"{count} sensor utilgjengelig","status.sensors_unavailable":"{count} sensorer utilgjengelige","status.setting_divergent":"{count} innstilling avviker","status.settings_divergent":"{count} innstillinger avviker","status.slot":"Slot: {title}","status.starts_at":"fra {time}","status.until":"til {time}","status.via_service":"Tjeneste","tile.fan":"Viftemodus","tile.mode":"Modus","tile.preset":"Forhåndsinnstilling","tile.swing":"Svingmodus","tile.swing_horizontal":"Horisontal sving"},nl:{"action.cooling":"Koelen","action.drying":"Ontvochtigen","action.fan":"Ventilator","action.heating":"Verwarmen","action.idle":"Inactief","action.off":"Uit","block.presence":"Afwezig","block.switch":"Hoofdschakelaar","block.switch_off":"Uit","block.switch_release":"Handmatige bediening","block.switch_temperature":"Temperatuur","block.window":"Raam open","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} tot {time}","card.entity_not_found":"Entiteit niet gevonden: {entity}","card.history":"Geschiedenis","card.more_info":"Meer info","card.settings":"Instellingen","common.decrease":"Verlagen","common.humidity":"Luchtvochtigheid","common.increase":"Verhogen","common.temperature":"Temperatuur","demo.group":"Demogroep","demo.presence_sensor":"Bewoner","demo.room.bathroom":"Badkamer","demo.room.bedroom":"Slaapkamer","demo.room.kitchen":"Keuken","demo.room.living_room":"Woonkamer","demo.schedule":"Demoschema","demo.slot":"Demoblok","demo.vacation":"Vakantie","demo.window_sensor":"Raam","editor.advanced_note":"Hoofdschakelaar, groepsoffset, boost en reset vereisen „Geavanceerde functies”.","editor.battery":"Batterij","editor.boost":"Boostknop","editor.boost_absolute":"Absolute temperatuur","editor.boost_duration":"Duur","editor.boost_invalid":"Onvolledig — de kaart toont geen boostknop.","editor.boost_relative":"Ten opzichte van het doel","editor.control.buttons":"−/+-knoppen","editor.control.slider":"Schuifregelaar","editor.control.toggle":"Weergaveschakelaar","editor.controls":"Bediening","editor.custom_name":"Eigen naam","editor.demo":"Demomodus (synthetische gegevens, geen entiteit nodig)","editor.deviations_badge":"Afwijkingsbadge","editor.features":"Functietegels","editor.group_entity":"Groepsentiteit","editor.header":"Kop","editor.history":"Geschiedenisknop","editor.main_switch":"Hoofdschakelaar","editor.more_info":"Meer info-knop","editor.name":"Naam","editor.offset":"Groepsoffset","editor.reset":"Resetknop","editor.section.badges":"Badges","editor.section.deviations":"Afwijkingen","editor.section.panel":"Paneel","editor.settings":"Instellingenknop","editor.status_cell":"Statusgebied","editor.title_placeholder":"Entiteitsnaam gebruiken","feature.calibration":"Kalibratie","feature.hold":"Vasthouden","feature.isolation":"Isolatie","feature.presence":"Aanwezigheid","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Raam","humidity.target":"Gewenste luchtvochtigheid","main_switch.label":"Hoofdschakelaar","member.details":"Details van {name} tonen","member.low_battery":"Batterij bijna leeg","member.unavailable":"Niet beschikbaar","mode.auto":"Automatisch","mode.cool":"Koelen","mode.dry":"Drogen","mode.fan_only":"Alleen ventilator","mode.heat":"Verwarmen","mode.heat_cool":"Verwarmen/Koelen","mode.off":"Uit","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-schema","reset.fallback":"Schema-terugval","reset.label":"Resetten","reset.offset":"Temperatuuroffset","reset.presets":"Groepsvoorinstellingen","reset.schedule":"Hoofdschema","source.manual":"Handmatig","source.mirror":"Spiegel","source.schedule":"Schema","source.sync":"Sync","source.window":"Raam","status.active":"Blok actief","status.active_until":"Blok actief tot {time}","status.blocking_for":"al {duration}","status.device_unavailable":"{count} apparaat niet beschikbaar","status.devices_unavailable":"{count} apparaten niet beschikbaar","status.isolated":"{count} geïsoleerd","status.layer_bypass":"Bypass","status.layer_fallback":"Terugval","status.low_battery":"{count} met bijna lege batterij","status.next_at":"Volgend blok vanaf {time}","status.next_slot":"Volgend blok: {title}","status.no_deviations":"Geen afwijkingen","status.offset":"Offset {value}","status.oob":"{count} buiten bereik","status.paused":"Gepauzeerd door blok of voorinstelling","status.remaining":"nog {duration}","status.sensor_unavailable":"{count} sensor niet beschikbaar","status.sensors_unavailable":"{count} sensoren niet beschikbaar","status.setting_divergent":"{count} instelling wijkt af","status.settings_divergent":"{count} instellingen wijken af","status.slot":"Blok: {title}","status.starts_at":"vanaf {time}","status.until":"tot {time}","status.via_service":"Service","tile.fan":"Ventilatormodus","tile.mode":"Modus","tile.preset":"Voorinstelling","tile.swing":"Zwenkmodus","tile.swing_horizontal":"Horizontaal zwenken"},pl:{"action.cooling":"Chłodzenie","action.drying":"Osuszanie","action.fan":"Wentylator","action.heating":"Ogrzewanie","action.idle":"Bezczynny","action.off":"Wyłączony","block.presence":"Nieobecny","block.switch":"Wyłącznik główny","block.switch_off":"Wyłączony","block.switch_release":"Sterowanie ręczne","block.switch_temperature":"Temperatura","block.window":"Okno otwarte","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} do {time}","card.entity_not_found":"Nie znaleziono encji: {entity}","card.history":"Historia","card.more_info":"Więcej informacji","card.settings":"Ustawienia","common.decrease":"Zmniejsz","common.humidity":"Wilgotność","common.increase":"Zwiększ","common.temperature":"Temperatura","demo.group":"Grupa demonstracyjna","demo.presence_sensor":"Mieszkaniec","demo.room.bathroom":"Łazienka","demo.room.bedroom":"Sypialnia","demo.room.kitchen":"Kuchnia","demo.room.living_room":"Salon","demo.schedule":"Harmonogram demonstracyjny","demo.slot":"Przedział demonstracyjny","demo.vacation":"Urlop","demo.window_sensor":"Okno","editor.advanced_note":"Wyłącznik główny, przesunięcie grupy, boost i resetowanie wymagają „Funkcje zaawansowane”.","editor.battery":"Bateria","editor.boost":"Przycisk boostu","editor.boost_absolute":"Temperatura bezwzględna","editor.boost_duration":"Czas trwania","editor.boost_invalid":"Niekompletne — karta nie pokazuje przycisku boostu.","editor.boost_relative":"Względem celu","editor.control.buttons":"Przyciski −/+","editor.control.slider":"Suwak","editor.control.toggle":"Przełącznik widoku","editor.controls":"Elementy sterujące","editor.custom_name":"Własna nazwa","editor.demo":"Tryb demo (dane syntetyczne, encja nie jest potrzebna)","editor.deviations_badge":"Plakietka odchyleń","editor.features":"Kafelki funkcji","editor.group_entity":"Encja grupy","editor.header":"Nagłówek","editor.history":"Przycisk historii","editor.main_switch":"Wyłącznik główny","editor.more_info":"Przycisk więcej informacji","editor.name":"Nazwa","editor.offset":"Przesunięcie grupy","editor.reset":"Przycisk resetu","editor.section.badges":"Odznaki","editor.section.deviations":"Odchylenia","editor.section.panel":"Panel","editor.settings":"Przycisk ustawień","editor.status_cell":"Obszar stanu","editor.title_placeholder":"Użyj nazwy encji","feature.calibration":"Kalibracja","feature.hold":"Wstrzymanie","feature.isolation":"Izolacja","feature.presence":"Obecność","feature.schedule":"Harmonogram","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Docelowa wilgotność","main_switch.label":"Wyłącznik główny","member.details":"Pokaż szczegóły: {name}","member.low_battery":"Słaba bateria","member.unavailable":"Niedostępny","mode.auto":"Automatyczny","mode.cool":"Chłodzenie","mode.dry":"Osuszanie","mode.fan_only":"Tylko wentylator","mode.heat":"Ogrzewanie","mode.heat_cool":"Ogrzewanie/Chłodzenie","mode.off":"Wyłączony","offset.label":"Przesunięcie","reset.boost":"Boost","reset.bypass":"Harmonogram obejścia","reset.fallback":"Zapas harmonogramu","reset.label":"Resetuj","reset.offset":"Przesunięcie temperatury","reset.presets":"Profile grupy","reset.schedule":"Główny harmonogram","source.manual":"Ręcznie","source.mirror":"Lustro","source.schedule":"Harmonogram","source.sync":"Sync","source.window":"Okno","status.active":"Blok aktywny","status.active_until":"Blok aktywny do {time}","status.blocking_for":"od {duration}","status.device_unavailable":"{count} urządzenie niedostępne","status.devices_unavailable":"Niedostępne urządzenia: {count}","status.isolated":"{count} izolowanych","status.layer_bypass":"Obejście","status.layer_fallback":"Zapas","status.low_battery":"{count} ze słabą baterią","status.next_at":"Następny blok od {time}","status.next_slot":"Następny blok: {title}","status.no_deviations":"Brak odchyleń","status.offset":"Przesunięcie {value}","status.oob":"{count} poza zakresem","status.paused":"Wstrzymane przez blok lub ustawienie wstępne","status.remaining":"pozostało {duration}","status.sensor_unavailable":"{count} czujnik niedostępny","status.sensors_unavailable":"Niedostępne czujniki: {count}","status.setting_divergent":"{count} ustawienie się różni","status.settings_divergent":"Rozbieżne ustawienia: {count}","status.slot":"Blok: {title}","status.starts_at":"od {time}","status.until":"do {time}","status.via_service":"Usługa","tile.fan":"Tryb wentylatora","tile.mode":"Tryb","tile.preset":"Ustawienie wstępne","tile.swing":"Tryb wahania","tile.swing_horizontal":"Wahanie poziome"},pt:{"action.cooling":"A arrefecer","action.drying":"A desumidificar","action.fan":"Ventilação","action.heating":"A aquecer","action.idle":"Inativo","action.off":"Desligado","block.presence":"Ausente","block.switch":"Interruptor principal","block.switch_off":"Desligado","block.switch_release":"Controlo manual","block.switch_temperature":"Temperatura","block.window":"Janela aberta","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} até às {time}","card.entity_not_found":"Entidade não encontrada: {entity}","card.history":"Histórico","card.more_info":"Mais informações","card.settings":"Definições","common.decrease":"Diminuir","common.humidity":"Humidade","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demonstração","demo.presence_sensor":"Morador","demo.room.bathroom":"Casa de banho","demo.room.bedroom":"Quarto","demo.room.kitchen":"Cozinha","demo.room.living_room":"Sala de estar","demo.schedule":"Agendamento de demonstração","demo.slot":"Intervalo de demonstração","demo.vacation":"Férias","demo.window_sensor":"Janela","editor.advanced_note":"Interruptor principal, desvio do grupo, boost e reposição exigem «Funcionalidades avançadas».","editor.battery":"Bateria","editor.boost":"Botão de boost","editor.boost_absolute":"Temperatura absoluta","editor.boost_duration":"Duração","editor.boost_invalid":"Incompleto — o cartão não mostra o botão de boost.","editor.boost_relative":"Relativo ao alvo","editor.control.buttons":"Botões −/+","editor.control.slider":"Controlo deslizante","editor.control.toggle":"Seletor de vista","editor.controls":"Controlos","editor.custom_name":"Nome personalizado","editor.demo":"Modo demo (dados sintéticos, não é necessária uma entidade)","editor.deviations_badge":"Emblema de desvios","editor.features":"Mosaicos de funções","editor.group_entity":"Entidade do grupo","editor.header":"Cabeçalho","editor.history":"Botão de histórico","editor.main_switch":"Interruptor principal","editor.more_info":"Botão de mais informações","editor.name":"Nome","editor.offset":"Desvio do grupo","editor.reset":"Botão de repor","editor.section.badges":"Emblemas","editor.section.deviations":"Desvios","editor.section.panel":"Painel","editor.settings":"Botão de definições","editor.status_cell":"Área de estado","editor.title_placeholder":"Usar o nome da entidade","feature.calibration":"Calibração","feature.hold":"Manter","feature.isolation":"Isolamento","feature.presence":"Presença","feature.schedule":"Agendamento","feature.sync":"Sync","feature.window":"Janela","humidity.target":"Humidade alvo","main_switch.label":"Interruptor principal","member.details":"Mostrar detalhes de {name}","member.low_battery":"Bateria fraca","member.unavailable":"Indisponível","mode.auto":"Automático","mode.cool":"Arrefecimento","mode.dry":"Desumidificação","mode.fan_only":"Apenas ventilação","mode.heat":"Aquecimento","mode.heat_cool":"Aquecimento/Arrefecimento","mode.off":"Desligado","offset.label":"Desvio","reset.boost":"Boost","reset.bypass":"Agendamento de substituição","reset.fallback":"Reserva do agendamento","reset.label":"Repor","reset.offset":"Desvio de temperatura","reset.presets":"Predefinições de grupo","reset.schedule":"Agendamento principal","source.manual":"Manual","source.mirror":"Espelho","source.schedule":"Agendamento","source.sync":"Sync","source.window":"Janela","status.active":"Bloco ativo","status.active_until":"Bloco ativo até {time}","status.blocking_for":"há {duration}","status.device_unavailable":"{count} dispositivo indisponível","status.devices_unavailable":"{count} dispositivos indisponíveis","status.isolated":"{count} isolado","status.layer_bypass":"Substituição","status.layer_fallback":"Reserva","status.low_battery":"{count} com bateria fraca","status.next_at":"Próximo bloco a partir de {time}","status.next_slot":"Próximo bloco: {title}","status.no_deviations":"Sem desvios","status.offset":"Desvio {value}","status.oob":"{count} fora do intervalo","status.paused":"Em pausa por um bloco ou predefinição","status.remaining":"faltam {duration}","status.sensor_unavailable":"{count} sensor indisponível","status.sensors_unavailable":"{count} sensores indisponíveis","status.setting_divergent":"{count} definição diverge","status.settings_divergent":"{count} definições divergem","status.slot":"Bloco: {title}","status.starts_at":"a partir de {time}","status.until":"até {time}","status.via_service":"Serviço","tile.fan":"Modo de ventilação","tile.mode":"Modo","tile.preset":"Predefinição","tile.swing":"Modo de oscilação","tile.swing_horizontal":"Oscilação horizontal"},"pt-BR":{"action.cooling":"Resfriando","action.drying":"Desumidificando","action.fan":"Ventilando","action.heating":"Aquecendo","action.idle":"Ocioso","action.off":"Desligado","block.presence":"Ausente","block.switch":"Interruptor principal","block.switch_off":"Desligado","block.switch_release":"Controle manual","block.switch_temperature":"Temperatura","block.window":"Janela aberta","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} até {time}","card.entity_not_found":"Entidade não encontrada: {entity}","card.history":"Histórico","card.more_info":"Mais informações","card.settings":"Configurações","common.decrease":"Diminuir","common.humidity":"Umidade","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demonstração","demo.presence_sensor":"Morador","demo.room.bathroom":"Banheiro","demo.room.bedroom":"Quarto","demo.room.kitchen":"Cozinha","demo.room.living_room":"Sala de estar","demo.schedule":"Agenda de demonstração","demo.slot":"Intervalo de demonstração","demo.vacation":"Férias","demo.window_sensor":"Janela","editor.advanced_note":"Interruptor principal, deslocamento do grupo, boost e redefinição exigem “Recursos avançados”.","editor.battery":"Bateria","editor.boost":"Botão de boost","editor.boost_absolute":"Temperatura absoluta","editor.boost_duration":"Duração","editor.boost_invalid":"Incompleto — o card não mostra o botão de boost.","editor.boost_relative":"Relativo ao alvo","editor.control.buttons":"Botões −/+","editor.control.slider":"Controle deslizante","editor.control.toggle":"Seletor de visualização","editor.controls":"Controles","editor.custom_name":"Nome personalizado","editor.demo":"Modo de demonstração (dados sintéticos, sem precisar de entidade)","editor.deviations_badge":"Selo de desvios","editor.features":"Blocos de recursos","editor.group_entity":"Entidade do grupo","editor.header":"Cabeçalho","editor.history":"Botão de histórico","editor.main_switch":"Interruptor principal","editor.more_info":"Botão de mais informações","editor.name":"Nome","editor.offset":"Deslocamento do grupo","editor.reset":"Botão de redefinir","editor.section.badges":"Selos","editor.section.deviations":"Desvios","editor.section.panel":"Painel","editor.settings":"Botão de configurações","editor.status_cell":"Área de status","editor.title_placeholder":"Usar o nome da entidade","feature.calibration":"Calibração","feature.hold":"Retenção","feature.isolation":"Isolamento","feature.presence":"Presença","feature.schedule":"Agenda","feature.sync":"Sync","feature.window":"Janela","humidity.target":"Umidade alvo","main_switch.label":"Interruptor principal","member.details":"Mostrar detalhes de {name}","member.low_battery":"Bateria fraca","member.unavailable":"Indisponível","mode.auto":"Automático","mode.cool":"Resfriar","mode.dry":"Secar","mode.fan_only":"Apenas ventilar","mode.heat":"Aquecer","mode.heat_cool":"Aquecer/Resfriar","mode.off":"Desligado","offset.label":"Deslocamento","reset.boost":"Boost","reset.bypass":"Agenda de exceção","reset.fallback":"Estado alternativo da agenda","reset.label":"Redefinir","reset.offset":"Deslocamento de temperatura","reset.presets":"Predefinições do grupo","reset.schedule":"Agenda principal","source.manual":"Manual","source.mirror":"Espelho","source.schedule":"Agenda","source.sync":"Sync","source.window":"Janela","status.active":"Intervalo ativo","status.active_until":"Intervalo ativo até {time}","status.blocking_for":"há {duration}","status.device_unavailable":"{count} dispositivo indisponível","status.devices_unavailable":"{count} dispositivos indisponíveis","status.isolated":"{count} isolado","status.layer_bypass":"Exceção","status.layer_fallback":"Alternativo","status.low_battery":"{count} com bateria fraca","status.next_at":"Próximo intervalo às {time}","status.next_slot":"Próximo intervalo: {title}","status.no_deviations":"Sem desvios","status.offset":"Deslocamento {value}","status.oob":"{count} fora dos limites","status.paused":"Pausado por um intervalo ou predefinição","status.remaining":"faltam {duration}","status.sensor_unavailable":"{count} sensor indisponível","status.sensors_unavailable":"{count} sensores indisponíveis","status.setting_divergent":"{count} configuração diverge","status.settings_divergent":"{count} configurações divergem","status.slot":"Intervalo: {title}","status.starts_at":"às {time}","status.until":"até {time}","status.via_service":"Serviço","tile.fan":"Modo de ventilação","tile.mode":"Modo","tile.preset":"Predefinição","tile.swing":"Modo de oscilação","tile.swing_horizontal":"Oscilação horizontal"},ro:{"action.cooling":"Răcire","action.drying":"Dezumidificare","action.fan":"Ventilare","action.heating":"Încălzire","action.idle":"Inactiv","action.off":"Oprit","block.presence":"Absent","block.switch":"Comutator principal","block.switch_off":"Oprit","block.switch_release":"Control manual","block.switch_temperature":"Temperatură","block.window":"Fereastră deschisă","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} până la {time}","card.entity_not_found":"Entitate negăsită: {entity}","card.history":"Istoric","card.more_info":"Mai multe informații","card.settings":"Setări","common.decrease":"Scădere","common.humidity":"Umiditate","common.increase":"Creștere","common.temperature":"Temperatură","demo.group":"Grup demonstrativ","demo.presence_sensor":"Locatar","demo.room.bathroom":"Baie","demo.room.bedroom":"Dormitor","demo.room.kitchen":"Bucătărie","demo.room.living_room":"Sufragerie","demo.schedule":"Program demonstrativ","demo.slot":"Interval demonstrativ","demo.vacation":"Vacanță","demo.window_sensor":"Fereastră","editor.advanced_note":"Comutatorul principal, decalajul grupului, boost-ul și resetarea necesită „Funcții avansate”.","editor.battery":"Baterie","editor.boost":"Buton boost","editor.boost_absolute":"Temperatură absolută","editor.boost_duration":"Durată","editor.boost_invalid":"Incomplet — cardul nu afișează butonul de boost.","editor.boost_relative":"Relativ la țintă","editor.control.buttons":"Butoane −/+","editor.control.slider":"Glisor","editor.control.toggle":"Comutator de vizualizare","editor.controls":"Comenzi","editor.custom_name":"Nume personalizat","editor.demo":"Mod demonstrativ (date sintetice, fără entitate)","editor.deviations_badge":"Insignă abateri","editor.features":"Plăci de funcții","editor.group_entity":"Entitatea grupului","editor.header":"Antet","editor.history":"Buton istoric","editor.main_switch":"Comutator principal","editor.more_info":"Buton mai multe informații","editor.name":"Nume","editor.offset":"Decalaj grup","editor.reset":"Buton resetare","editor.section.badges":"Insigne","editor.section.deviations":"Abateri","editor.section.panel":"Panou","editor.settings":"Buton setări","editor.status_cell":"Zonă de stare","editor.title_placeholder":"Folosește numele entității","feature.calibration":"Calibrare","feature.hold":"Menținere","feature.isolation":"Izolare","feature.presence":"Prezență","feature.schedule":"Program","feature.sync":"Sync","feature.window":"Fereastră","humidity.target":"Umiditate țintă","main_switch.label":"Comutator principal","member.details":"Afișează detaliile pentru {name}","member.low_battery":"Baterie descărcată","member.unavailable":"Indisponibil","mode.auto":"Automat","mode.cool":"Răcire","mode.dry":"Dezumidificare","mode.fan_only":"Ventilare","mode.heat":"Încălzire","mode.heat_cool":"Încălzire/Răcire","mode.off":"Oprit","offset.label":"Decalaj","reset.boost":"Boost","reset.bypass":"Program de excepție","reset.fallback":"Starea de rezervă a programului","reset.label":"Resetare","reset.offset":"Decalaj de temperatură","reset.presets":"Presetări de grup","reset.schedule":"Program principal","source.manual":"Manual","source.mirror":"Oglindire","source.schedule":"Program","source.sync":"Sync","source.window":"Fereastră","status.active":"Interval activ","status.active_until":"Interval activ până la {time}","status.blocking_for":"de {duration}","status.device_unavailable":"{count} dispozitiv indisponibil","status.devices_unavailable":"{count} dispozitive indisponibile","status.isolated":"{count} izolat","status.layer_bypass":"Excepție","status.layer_fallback":"Rezervă","status.low_battery":"{count} cu baterie descărcată","status.next_at":"Următorul interval la {time}","status.next_slot":"Următorul interval: {title}","status.no_deviations":"Fără abateri","status.offset":"Decalaj {value}","status.oob":"{count} în afara limitelor","status.paused":"Pus pe pauză de un interval sau o presetare","status.remaining":"încă {duration}","status.sensor_unavailable":"{count} senzor indisponibil","status.sensors_unavailable":"{count} senzori indisponibili","status.setting_divergent":"{count} setare diferă","status.settings_divergent":"{count} setări diferă","status.slot":"Interval: {title}","status.starts_at":"la {time}","status.until":"până la {time}","status.via_service":"Serviciu","tile.fan":"Mod ventilator","tile.mode":"Mod","tile.preset":"Presetare","tile.swing":"Mod baleiaj","tile.swing_horizontal":"Baleiaj orizontal"},sk:{"action.cooling":"Chladenie","action.drying":"Odvlhčovanie","action.fan":"Ventilátor","action.heating":"Kúrenie","action.idle":"Nečinný","action.off":"Vypnuté","block.presence":"Neprítomný","block.switch":"Hlavný vypínač","block.switch_off":"Vypnuté","block.switch_release":"Ručné ovládanie","block.switch_temperature":"Teplota","block.window":"Okno otvorené","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} do {time}","card.entity_not_found":"Entita sa nenašla: {entity}","card.history":"História","card.more_info":"Viac informácií","card.settings":"Nastavenia","common.decrease":"Znížiť","common.humidity":"Vlhkosť","common.increase":"Zvýšiť","common.temperature":"Teplota","demo.group":"Demo skupina","demo.presence_sensor":"Obyvateľ","demo.room.bathroom":"Kúpeľňa","demo.room.bedroom":"Spálňa","demo.room.kitchen":"Kuchyňa","demo.room.living_room":"Obývačka","demo.schedule":"Demo plán","demo.slot":"Demo úsek","demo.vacation":"Dovolenka","demo.window_sensor":"Okno","editor.advanced_note":"Hlavný vypínač, offset skupiny, boost a obnovenie vyžadujú „Pokročilé funkcie“.","editor.battery":"Batéria","editor.boost":"Tlačidlo boostu","editor.boost_absolute":"Absolútna teplota","editor.boost_duration":"Trvanie","editor.boost_invalid":"Neúplné — karta nezobrazí tlačidlo boostu.","editor.boost_relative":"Relatívne k cieľu","editor.control.buttons":"Tlačidlá −/+","editor.control.slider":"Posuvník","editor.control.toggle":"Prepínač zobrazenia","editor.controls":"Ovládacie prvky","editor.custom_name":"Vlastný názov","editor.demo":"Režim ukážky (syntetické údaje, entita nie je potrebná)","editor.deviations_badge":"Odznak odchýlok","editor.features":"Dlaždice funkcií","editor.group_entity":"Entita skupiny","editor.header":"Hlavička","editor.history":"Tlačidlo histórie","editor.main_switch":"Hlavný vypínač","editor.more_info":"Tlačidlo viac informácií","editor.name":"Názov","editor.offset":"Offset skupiny","editor.reset":"Tlačidlo obnovenia","editor.section.badges":"Odznaky","editor.section.deviations":"Odchýlky","editor.section.panel":"Panel","editor.settings":"Tlačidlo nastavení","editor.status_cell":"Stavová oblasť","editor.title_placeholder":"Použiť názov entity","feature.calibration":"Kalibrácia","feature.hold":"Podržať","feature.isolation":"Izolácia","feature.presence":"Prítomnosť","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cieľová vlhkosť","main_switch.label":"Hlavný vypínač","member.details":"Zobraziť podrobnosti: {name}","member.low_battery":"Slabá batéria","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chladenie","mode.dry":"Odvlhčovanie","mode.fan_only":"Iba ventilátor","mode.heat":"Kúrenie","mode.heat_cool":"Kúrenie/Chladenie","mode.off":"Vypnuté","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Obchádzkový plán","reset.fallback":"Náhradný plán","reset.label":"Obnoviť","reset.offset":"Teplotný offset","reset.presets":"Predvoľby skupiny","reset.schedule":"Hlavný plán","source.manual":"Ručne","source.mirror":"Zrkadlenie","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Blok aktívny","status.active_until":"Blok aktívny do {time}","status.blocking_for":"už {duration}","status.device_unavailable":"{count} zariadenie nedostupné","status.devices_unavailable":"Nedostupné zariadenia: {count}","status.isolated":"{count} izolovaných","status.layer_bypass":"Obchádzka","status.layer_fallback":"Náhradný","status.low_battery":"{count} so slabou batériou","status.next_at":"Ďalší blok od {time}","status.next_slot":"Ďalší blok: {title}","status.no_deviations":"Žiadne odchýlky","status.offset":"Offset {value}","status.oob":"{count} mimo rozsahu","status.paused":"Pozastavené blokom alebo predvoľbou","status.remaining":"zostáva {duration}","status.sensor_unavailable":"{count} senzor nedostupný","status.sensors_unavailable":"Nedostupné senzory: {count}","status.setting_divergent":"{count} nastavenie sa líši","status.settings_divergent":"Rozdielne nastavenia: {count}","status.slot":"Blok: {title}","status.starts_at":"od {time}","status.until":"do {time}","status.via_service":"Služba","tile.fan":"Režim ventilátora","tile.mode":"Režim","tile.preset":"Predvoľba","tile.swing":"Režim natáčania","tile.swing_horizontal":"Vodorovné natáčanie"},sv:{"action.cooling":"Kyler","action.drying":"Avfuktar","action.fan":"Fläkt","action.heating":"Värmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borta","block.switch":"Huvudbrytare","block.switch_off":"Av","block.switch_release":"Manuell styrning","block.switch_temperature":"Temperatur","block.window":"Fönster öppet","boost.duration":"{minutes} min","boost.label":"Boost","boost.running":"{temperature} till {time}","card.entity_not_found":"Entitet hittades inte: {entity}","card.history":"Historik","card.more_info":"Mer info","card.settings":"Inställningar","common.decrease":"Minska","common.humidity":"Luftfuktighet","common.increase":"Öka","common.temperature":"Temperatur","demo.group":"Demogrupp","demo.presence_sensor":"Boende","demo.room.bathroom":"Badrum","demo.room.bedroom":"Sovrum","demo.room.kitchen":"Kök","demo.room.living_room":"Vardagsrum","demo.schedule":"Demoschema","demo.slot":"Demopass","demo.vacation":"Semester","demo.window_sensor":"Fönster","editor.advanced_note":"Huvudbrytare, gruppförskjutning, boost och återställning kräver ”Avancerade funktioner”.","editor.battery":"Batteri","editor.boost":"Boostknapp","editor.boost_absolute":"Absolut temperatur","editor.boost_duration":"Varaktighet","editor.boost_invalid":"Ofullständig — kortet visar ingen boostknapp.","editor.boost_relative":"I förhållande till målet","editor.control.buttons":"−/+-knappar","editor.control.slider":"Reglage","editor.control.toggle":"Växla vy","editor.controls":"Kontroller","editor.custom_name":"Eget namn","editor.demo":"Demoläge (syntetiska data, ingen entitet behövs)","editor.deviations_badge":"Avvikelsemärke","editor.features":"Funktionsrutor","editor.group_entity":"Gruppentitet","editor.header":"Sidhuvud","editor.history":"Historikknapp","editor.main_switch":"Huvudbrytare","editor.more_info":"Mer info-knapp","editor.name":"Namn","editor.offset":"Gruppförskjutning","editor.reset":"Återställningsknapp","editor.section.badges":"Märken","editor.section.deviations":"Avvikelser","editor.section.panel":"Panel","editor.settings":"Inställningsknapp","editor.status_cell":"Statusområde","editor.title_placeholder":"Använd entitetens namn","feature.calibration":"Kalibrering","feature.hold":"Håll","feature.isolation":"Isolering","feature.presence":"Närvaro","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Fönster","humidity.target":"Önskad luftfuktighet","main_switch.label":"Huvudbrytare","member.details":"Visa detaljer för {name}","member.low_battery":"Låg batterinivå","member.unavailable":"Otillgänglig","mode.auto":"Automatiskt","mode.cool":"Kyla","mode.dry":"Avfuktning","mode.fan_only":"Endast fläkt","mode.heat":"Värme","mode.heat_cool":"Värme/Kyla","mode.off":"Av","offset.label":"Offset","reset.boost":"Boost","reset.bypass":"Bypass-schema","reset.fallback":"Schemareserv","reset.label":"Återställ","reset.offset":"Temperaturförskjutning","reset.presets":"Gruppförinställningar","reset.schedule":"Huvudschema","source.manual":"Manuell","source.mirror":"Spegling","source.schedule":"Schema","source.sync":"Sync","source.window":"Fönster","status.active":"Block aktivt","status.active_until":"Block aktivt till {time}","status.blocking_for":"i {duration}","status.device_unavailable":"{count} enhet otillgänglig","status.devices_unavailable":"{count} enheter otillgängliga","status.isolated":"{count} isolerad","status.layer_bypass":"Bypass","status.layer_fallback":"Reserv","status.low_battery":"{count} med låg batterinivå","status.next_at":"Nästa block från {time}","status.next_slot":"Nästa block: {title}","status.no_deviations":"Inga avvikelser","status.offset":"Offset {value}","status.oob":"{count} utanför intervallet","status.paused":"Pausad av block eller förinställning","status.remaining":"{duration} kvar","status.sensor_unavailable":"{count} sensor otillgänglig","status.sensors_unavailable":"{count} sensorer otillgängliga","status.setting_divergent":"{count} inställning avviker","status.settings_divergent":"{count} inställningar avviker","status.slot":"Block: {title}","status.starts_at":"från {time}","status.until":"till {time}","status.via_service":"Tjänst","tile.fan":"Fläktläge","tile.mode":"Läge","tile.preset":"Förinställning","tile.swing":"Svängläge","tile.swing_horizontal":"Horisontell sväng"},tr:{"action.cooling":"Soğutuyor","action.drying":"Nem alıyor","action.fan":"Fan","action.heating":"Isıtıyor","action.idle":"Boşta","action.off":"Kapalı","block.presence":"Dışarıda","block.switch":"Ana şalter","block.switch_off":"Kapalı","block.switch_release":"Manuel kontrol","block.switch_temperature":"Sıcaklık","block.window":"Pencere açık","boost.duration":"{minutes} dk","boost.label":"Boost","boost.running":"{time} saatine kadar {temperature}","card.entity_not_found":"Varlık bulunamadı: {entity}","card.history":"Geçmiş","card.more_info":"Daha fazla bilgi","card.settings":"Ayarlar","common.decrease":"Azalt","common.humidity":"Nem","common.increase":"Artır","common.temperature":"Sıcaklık","demo.group":"Demo grubu","demo.presence_sensor":"Sakin","demo.room.bathroom":"Banyo","demo.room.bedroom":"Yatak odası","demo.room.kitchen":"Mutfak","demo.room.living_room":"Oturma odası","demo.schedule":"Demo zamanlaması","demo.slot":"Demo zaman dilimi","demo.vacation":"Tatil","demo.window_sensor":"Pencere","editor.advanced_note":"Ana şalter, grup ofseti, boost ve sıfırlama için “Gelişmiş Özellikler” gerekir.","editor.battery":"Pil","editor.boost":"Boost düğmesi","editor.boost_absolute":"Mutlak sıcaklık","editor.boost_duration":"Süre","editor.boost_invalid":"Eksik — kart boost düğmesi göstermez.","editor.boost_relative":"Hedefe göre","editor.control.buttons":"−/+ düğmeleri","editor.control.slider":"Kaydırıcı","editor.control.toggle":"Görünüm geçişi","editor.controls":"Kontroller","editor.custom_name":"Özel ad","editor.demo":"Demo modu (sentetik veri, varlık gerekmez)","editor.deviations_badge":"Sapma rozeti","editor.features":"Özellik kutucukları","editor.group_entity":"Grup varlığı","editor.header":"Üst bilgi","editor.history":"Geçmiş düğmesi","editor.main_switch":"Ana şalter","editor.more_info":"Daha fazla bilgi düğmesi","editor.name":"Ad","editor.offset":"Grup ofseti","editor.reset":"Sıfırlama düğmesi","editor.section.badges":"Rozetler","editor.section.deviations":"Sapmalar","editor.section.panel":"Panel","editor.settings":"Ayarlar düğmesi","editor.status_cell":"Durum alanı","editor.title_placeholder":"Varlık adını kullan","feature.calibration":"Kalibrasyon","feature.hold":"Beklet","feature.isolation":"İzolasyon","feature.presence":"Varlık algılama","feature.schedule":"Zamanlama","feature.sync":"Sync","feature.window":"Pencere","humidity.target":"Hedef nem","main_switch.label":"Ana şalter","member.details":"{name} ayrıntılarını göster","member.low_battery":"Pil zayıf","member.unavailable":"Kullanılamıyor","mode.auto":"Otomatik","mode.cool":"Soğutma","mode.dry":"Nem alma","mode.fan_only":"Yalnızca fan","mode.heat":"Isıtma","mode.heat_cool":"Isıtma/Soğutma","mode.off":"Kapalı","offset.label":"Ofset","reset.boost":"Boost","reset.bypass":"Bypass zamanlaması","reset.fallback":"Zamanlama yedeği","reset.label":"Sıfırla","reset.offset":"Sıcaklık ofseti","reset.presets":"Grup ön ayarları","reset.schedule":"Ana zamanlama","source.manual":"Manuel","source.mirror":"Yansıtma","source.schedule":"Zamanlama","source.sync":"Sync","source.window":"Pencere","status.active":"Dilim etkin","status.active_until":"Dilim etkin, bitiş: {time}","status.blocking_for":"{duration} beri","status.device_unavailable":"{count} cihaz kullanılamıyor","status.devices_unavailable":"{count} cihaz kullanılamıyor","status.isolated":"{count} izole","status.layer_bypass":"Bypass","status.layer_fallback":"Yedek","status.low_battery":"{count} cihazda pil zayıf","status.next_at":"Sonraki dilim başlangıç: {time}","status.next_slot":"Sonraki dilim: {title}","status.no_deviations":"Sapma yok","status.offset":"Ofset {value}","status.oob":"{count} aralık dışında","status.paused":"Bir dilim veya ön ayar tarafından duraklatıldı","status.remaining":"{duration} kaldı","status.sensor_unavailable":"{count} sensör kullanılamıyor","status.sensors_unavailable":"{count} sensör kullanılamıyor","status.setting_divergent":"{count} ayar farklı","status.settings_divergent":"{count} ayar farklı","status.slot":"Dilim: {title}","status.starts_at":"başlangıç: {time}","status.until":"bitiş: {time}","status.via_service":"Hizmet","tile.fan":"Fan modu","tile.mode":"Mod","tile.preset":"Ön ayar","tile.swing":"Salınım modu","tile.swing_horizontal":"Yatay salınım"},uk:{"action.cooling":"Охолодження","action.drying":"Осушення","action.fan":"Вентилятор","action.heating":"Нагрівання","action.idle":"Очікування","action.off":"Вимкнено","block.presence":"Відсутній","block.switch":"Головний вимикач","block.switch_off":"Вимкнено","block.switch_release":"Ручне керування","block.switch_temperature":"Температура","block.window":"Вікно відкрите","boost.duration":"{minutes} хв","boost.label":"Boost","boost.running":"{temperature} до {time}","card.entity_not_found":"Сутність не знайдено: {entity}","card.history":"Історія","card.more_info":"Докладніше","card.settings":"Налаштування","common.decrease":"Зменшити","common.humidity":"Вологість","common.increase":"Збільшити","common.temperature":"Температура","demo.group":"Демо-група","demo.presence_sensor":"Мешканець","demo.room.bathroom":"Ванна кімната","demo.room.bedroom":"Спальня","demo.room.kitchen":"Кухня","demo.room.living_room":"Вітальня","demo.schedule":"Демо-розклад","demo.slot":"Демо-інтервал","demo.vacation":"Відпустка","demo.window_sensor":"Вікно","editor.advanced_note":"Головний вимикач, зміщення групи, boost і скидання потребують «Розширені функції».","editor.battery":"Батарея","editor.boost":"Кнопка boost","editor.boost_absolute":"Абсолютна температура","editor.boost_duration":"Тривалість","editor.boost_invalid":"Неповно — картка не показує кнопку boost.","editor.boost_relative":"Відносно цілі","editor.control.buttons":"Кнопки −/+","editor.control.slider":"Повзунок","editor.control.toggle":"Перемикач вигляду","editor.controls":"Елементи керування","editor.custom_name":"Власна назва","editor.demo":"Демо-режим (синтетичні дані, сутність не потрібна)","editor.deviations_badge":"Значок відхилень","editor.features":"Плитки функцій","editor.group_entity":"Сутність групи","editor.header":"Верхня панель","editor.history":"Кнопка історії","editor.main_switch":"Головний вимикач","editor.more_info":"Кнопка «Докладніше»","editor.name":"Назва","editor.offset":"Зміщення групи","editor.reset":"Кнопка скидання","editor.section.badges":"Значки","editor.section.deviations":"Відхилення","editor.section.panel":"Панель","editor.settings":"Кнопка налаштувань","editor.status_cell":"Область стану","editor.title_placeholder":"Використати назву сутності","feature.calibration":"Калібрування","feature.hold":"Утримання","feature.isolation":"Ізоляція","feature.presence":"Присутність","feature.schedule":"Розклад","feature.sync":"Sync","feature.window":"Вікно","humidity.target":"Цільова вологість","main_switch.label":"Головний вимикач","member.details":"Показати деталі: {name}","member.low_battery":"Низький заряд батареї","member.unavailable":"Недоступно","mode.auto":"Автоматично","mode.cool":"Охолодження","mode.dry":"Осушення","mode.fan_only":"Лише вентилятор","mode.heat":"Нагрівання","mode.heat_cool":"Нагрівання/Охолодження","mode.off":"Вимкнено","offset.label":"Зміщення","reset.boost":"Boost","reset.bypass":"Обхідний розклад","reset.fallback":"Резерв розкладу","reset.label":"Скинути","reset.offset":"Зміщення температури","reset.presets":"Пресети групи","reset.schedule":"Головний розклад","source.manual":"Вручну","source.mirror":"Дзеркало","source.schedule":"Розклад","source.sync":"Sync","source.window":"Вікно","status.active":"Слот активний","status.active_until":"Слот активний до {time}","status.blocking_for":"уже {duration}","status.device_unavailable":"{count} пристрій недоступний","status.devices_unavailable":"Недоступні пристрої: {count}","status.isolated":"{count} ізольовано","status.layer_bypass":"Обхід","status.layer_fallback":"Резерв","status.low_battery":"{count} з низьким зарядом батареї","status.next_at":"Наступний слот з {time}","status.next_slot":"Наступний слот: {title}","status.no_deviations":"Немає відхилень","status.offset":"Зміщення {value}","status.oob":"{count} поза межами","status.paused":"Призупинено слотом або пресетом","status.remaining":"залишилось {duration}","status.sensor_unavailable":"{count} датчик недоступний","status.sensors_unavailable":"Недоступні датчики: {count}","status.setting_divergent":"{count} налаштування відрізняється","status.settings_divergent":"Розбіжні налаштування: {count}","status.slot":"Слот: {title}","status.starts_at":"з {time}","status.until":"до {time}","status.via_service":"Сервіс","tile.fan":"Режим вентилятора","tile.mode":"Режим","tile.preset":"Пресет","tile.swing":"Режим коливання","tile.swing_horizontal":"Горизонтальне коливання"},zh:{"action.cooling":"制冷中","action.drying":"除湿中","action.fan":"送风","action.heating":"制热中","action.idle":"空闲","action.off":"关闭","block.presence":"离开","block.switch":"主开关","block.switch_off":"关闭","block.switch_release":"手动控制","block.switch_temperature":"温度","block.window":"窗户已打开","boost.duration":"{minutes} 分钟","boost.label":"Boost","boost.running":"{temperature}，至 {time}","card.entity_not_found":"未找到实体：{entity}","card.history":"历史","card.more_info":"更多信息","card.settings":"设置","common.decrease":"降低","common.humidity":"湿度","common.increase":"升高","common.temperature":"温度","demo.group":"演示组","demo.presence_sensor":"住户","demo.room.bathroom":"浴室","demo.room.bedroom":"卧室","demo.room.kitchen":"厨房","demo.room.living_room":"客厅","demo.schedule":"演示计划","demo.slot":"演示时段","demo.vacation":"假期","demo.window_sensor":"窗户","editor.advanced_note":"主开关、组偏移、Boost 和重置需要“高级功能”。","editor.battery":"电池","editor.boost":"Boost 按钮","editor.boost_absolute":"绝对温度","editor.boost_duration":"时长","editor.boost_invalid":"不完整 — 卡片不显示 Boost 按钮。","editor.boost_relative":"相对于目标","editor.control.buttons":"−/+ 按钮","editor.control.slider":"滑块","editor.control.toggle":"视图切换","editor.controls":"控件","editor.custom_name":"自定义名称","editor.demo":"演示模式（合成数据，无需实体）","editor.deviations_badge":"偏差徽章","editor.features":"功能磁贴","editor.group_entity":"群组实体","editor.header":"顶部栏","editor.history":"历史按钮","editor.main_switch":"主开关","editor.more_info":"更多信息按钮","editor.name":"名称","editor.offset":"组偏移","editor.reset":"重置按钮","editor.section.badges":"徽章","editor.section.deviations":"偏差","editor.section.panel":"面板","editor.settings":"设置按钮","editor.status_cell":"状态区","editor.title_placeholder":"使用实体名称","feature.calibration":"校准","feature.hold":"保持","feature.isolation":"隔离","feature.presence":"人员在场","feature.schedule":"计划","feature.sync":"同步","feature.window":"窗户","humidity.target":"目标湿度","main_switch.label":"主开关","member.details":"显示 {name} 的详情","member.low_battery":"电量低","member.unavailable":"不可用","mode.auto":"自动","mode.cool":"制冷","mode.dry":"除湿","mode.fan_only":"仅送风","mode.heat":"制热","mode.heat_cool":"制热/制冷","mode.off":"关闭","offset.label":"偏移","reset.boost":"Boost","reset.bypass":"旁路计划","reset.fallback":"计划后备","reset.label":"重置","reset.offset":"温度偏移","reset.presets":"组预设","reset.schedule":"主计划","source.manual":"手动","source.mirror":"镜像","source.schedule":"计划","source.sync":"同步","source.window":"窗户","status.active":"时段进行中","status.active_until":"时段进行中，至 {time}","status.blocking_for":"已 {duration}","status.device_unavailable":"{count} 个设备不可用","status.devices_unavailable":"{count} 个设备不可用","status.isolated":"{count} 个已隔离","status.layer_bypass":"旁路","status.layer_fallback":"后备","status.low_battery":"{count} 个电量低","status.next_at":"下一时段 {time} 开始","status.next_slot":"下一时段：{title}","status.no_deviations":"无偏差","status.offset":"偏移 {value}","status.oob":"{count} 个超出范围","status.paused":"已被时段或预设暂停","status.remaining":"剩余 {duration}","status.sensor_unavailable":"{count} 个传感器不可用","status.sensors_unavailable":"{count} 个传感器不可用","status.setting_divergent":"{count} 项设置不一致","status.settings_divergent":"{count} 项设置不一致","status.slot":"时段：{title}","status.starts_at":"{time} 开始","status.until":"至 {time}","status.via_service":"服务","tile.fan":"风速模式","tile.mode":"模式","tile.preset":"预设","tile.swing":"摆风模式","tile.swing_horizontal":"水平摆风"},"zh-Hant":{"action.cooling":"冷氣運轉中","action.drying":"除濕中","action.fan":"送風","action.heating":"暖氣運轉中","action.idle":"待命","action.off":"關閉","block.presence":"離家","block.switch":"總開關","block.switch_off":"關閉","block.switch_release":"手動控制","block.switch_temperature":"溫度","block.window":"窗戶已開啟","boost.duration":"{minutes} 分鐘","boost.label":"Boost","boost.running":"{temperature}，至 {time}","card.entity_not_found":"找不到實體：{entity}","card.history":"歷史紀錄","card.more_info":"更多資訊","card.settings":"設定","common.decrease":"調低","common.humidity":"濕度","common.increase":"調高","common.temperature":"溫度","demo.group":"示範群組","demo.presence_sensor":"住戶","demo.room.bathroom":"浴室","demo.room.bedroom":"臥室","demo.room.kitchen":"廚房","demo.room.living_room":"客廳","demo.schedule":"示範排程","demo.slot":"示範時段","demo.vacation":"休假","demo.window_sensor":"窗戶","editor.advanced_note":"總開關、群組偏移、Boost 與重設需要啟用「進階功能」。","editor.battery":"電池","editor.boost":"Boost 按鈕","editor.boost_absolute":"絕對溫度","editor.boost_duration":"持續時間","editor.boost_invalid":"設定不完整 — 卡片不會顯示 Boost 按鈕。","editor.boost_relative":"相對於目標溫度","editor.control.buttons":"−/+ 按鈕","editor.control.slider":"滑桿","editor.control.toggle":"檢視切換","editor.controls":"控制項","editor.custom_name":"自訂名稱","editor.demo":"示範模式（模擬資料，不需要實體）","editor.deviations_badge":"差異徽章","editor.features":"功能方塊","editor.group_entity":"群組實體","editor.header":"標題列","editor.history":"歷史紀錄按鈕","editor.main_switch":"總開關","editor.more_info":"更多資訊按鈕","editor.name":"名稱","editor.offset":"群組偏移","editor.reset":"重設按鈕","editor.section.badges":"徽章","editor.section.deviations":"差異","editor.section.panel":"面板","editor.settings":"設定按鈕","editor.status_cell":"狀態區","editor.title_placeholder":"使用實體名稱","feature.calibration":"校正","feature.hold":"保持","feature.isolation":"隔離","feature.presence":"在場偵測","feature.schedule":"排程","feature.sync":"同步","feature.window":"窗戶","humidity.target":"目標濕度","main_switch.label":"總開關","member.details":"顯示 {name} 的詳細資訊","member.low_battery":"電量低","member.unavailable":"無法使用","mode.auto":"自動","mode.cool":"冷氣","mode.dry":"除濕","mode.fan_only":"僅送風","mode.heat":"暖氣","mode.heat_cool":"暖氣/冷氣","mode.off":"關閉","offset.label":"偏移","reset.boost":"Boost","reset.bypass":"例外排程","reset.fallback":"排程備援","reset.label":"重設","reset.offset":"溫度偏移","reset.presets":"群組預置","reset.schedule":"主排程","source.manual":"手動","source.mirror":"鏡像","source.schedule":"排程","source.sync":"同步","source.window":"窗戶","status.active":"時段進行中","status.active_until":"時段進行中，至 {time}","status.blocking_for":"已 {duration}","status.device_unavailable":"{count} 個裝置無法使用","status.devices_unavailable":"{count} 個裝置無法使用","status.isolated":"{count} 個已隔離","status.layer_bypass":"例外","status.layer_fallback":"備援","status.low_battery":"{count} 個電量低","status.next_at":"下一個時段 {time} 開始","status.next_slot":"下一個時段：{title}","status.no_deviations":"無差異","status.offset":"偏移 {value}","status.oob":"{count} 個超出範圍","status.paused":"已被時段或預置暫停","status.remaining":"剩餘 {duration}","status.sensor_unavailable":"{count} 個感測器無法使用","status.sensors_unavailable":"{count} 個感測器無法使用","status.setting_divergent":"{count} 項設定不一致","status.settings_divergent":"{count} 項設定不一致","status.slot":"時段：{title}","status.starts_at":"{time} 開始","status.until":"至 {time}","status.via_service":"服務","tile.fan":"風速模式","tile.mode":"模式","tile.preset":"預置","tile.swing":"擺動模式","tile.swing_horizontal":"水平擺動模式"}},Aa=/^zh-(hant|tw|hk|mo)\b/,Ca=/^pt-br\b/,Sa=e=>{const t=(e??"en").toLowerCase();return Aa.test(t)?"zh-Hant":Ca.test(t)?"pt-BR":t.split("-")[0]},io=(e,t,o)=>{const i=(kt[Sa(e)]??kt.en)[t]??kt.en[t]??t;return o?i.replace(/\{(\w+)\}/g,(a,n)=>n in o?String(o[n]):a):i},ao=(e,t,o)=>{var a;if(!o)return"";const s=`${t}.${o}`,i=((a=e==null?void 0:e.locale)==null?void 0:a.language)??(e==null?void 0:e.language);return s in kt.en?io(i,s):o},bs=(e,t,o)=>t?ao(e,"action",t):ao(e,"mode",o);function Y(e){return class extends e{t(t,o){var i,a,n;const s=((a=(i=this.hass)==null?void 0:i.locale)==null?void 0:a.language)??((n=this.hass)==null?void 0:n.language);return io(s,t,o)}}}var Oa=Object.defineProperty,Ea=Object.getOwnPropertyDescriptor,$t=(e,t,o,s)=>{for(var i=s>1?void 0:s?Ea(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&Oa(t,o,i),i};let Ce=class extends Y(S){constructor(){super(...arguments),this.disabled=!1}get _outlineStyle(){return this.color?he({"--cgh-btn-outline":this.color}):c}_emit(e){this.dispatchEvent(new CustomEvent("cgh-step",{detail:{direction:e},bubbles:!0,composed:!0}))}render(){return d`
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
    `}};Ce.styles=C`
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
  `,$t([m({attribute:!1})],Ce.prototype,"hass",2),$t([m({type:Boolean})],Ce.prototype,"disabled",2),$t([m()],Ce.prototype,"color",2),Ce=$t([L("cgh-number-buttons")],Ce);const U=e=>{const t=e==null?void 0:e.locale;if(!t)return e==null?void 0:e.language;switch(t.number_format){case"comma_decimal":return["en-US","en"];case"decimal_comma":return["de","es","it"];case"space_comma":return["fr","sv","cs"];case"quote_decimal":return["de-CH"];case"system":return;default:return t.language}},no=(e,t,o)=>{var l,u;const s=e instanceof Date?e:new Date(e),i=(l=t==null?void 0:t.locale)==null?void 0:l.time_format,a=((u=t==null?void 0:t.locale)==null?void 0:u.language)??(t==null?void 0:t.language),n=i==="system"?void 0:a,r=i==="12"||(i==="language"||i==="system"||!i)&&new Date("January 1, 2026 22:00:00").toLocaleString(n).includes("10");try{return new Intl.DateTimeFormat(a,{hourCycle:r?"h12":"h23",...o}).format(s)}catch{return s.toLocaleTimeString()}},gs=(e,t,o=!1,s=Date.now())=>{const i=l=>new Date(l.getFullYear(),l.getMonth(),l.getDate()),a=Math.round((i(e).getTime()-i(new Date(s)).getTime())/864e5),n={hour:"2-digit",minute:"2-digit"},r=a>0&&a<7?{weekday:"short"}:{day:"numeric",month:"numeric"};return o?no(e,t,r):no(e,t,a===0?n:{...r,...n})},Ma=(e,t)=>{var i;const o=e<60?"minute":e<1440?"hour":"day",s=o==="minute"?e:o==="hour"?e/60:e/1440;return new Intl.NumberFormat(((i=t==null?void 0:t.locale)==null?void 0:i.language)??(t==null?void 0:t.language),{style:"unit",unit:o,unitDisplay:"short"}).format(Math.max(1,Math.floor(s)))},za=(e,t)=>{const o=(n,r)=>{var l;return new Intl.NumberFormat(((l=t==null?void 0:t.locale)==null?void 0:l.language)??(t==null?void 0:t.language),{style:"unit",unit:r,unitDisplay:"short"}).format(n)},s=Math.max(1,Math.round(e));if(s<60)return o(s,"minute");const i=s%60,a=o(Math.floor(s/60),"hour");return i?`${a} ${o(i,"minute")}`:a},Ta=(e,t)=>{var r,l;if(!e)return;const o=((l=(r=t==null?void 0:t.config)==null?void 0:r.unit_system)==null?void 0:l.temperature)??"°C",s=u=>new Intl.NumberFormat(U(t),{maximumFractionDigits:1}).format(u),i=e.target_temp_low,a=e.target_temp_high;if(i!=null&&a!=null)return`${s(i)}–${s(a)} ${o}`;const n=e.temperature;return n!=null?`${s(n)} ${o}`:void 0},ro=(e,t,o=!1)=>{var a,n;const s=new Intl.NumberFormat(U(t),{minimumFractionDigits:1,maximumFractionDigits:1,signDisplay:"exceptZero"}).format(e);if(o)return`${s}°`;const i=((n=(a=t==null?void 0:t.config)==null?void 0:a.unit_system)==null?void 0:n.temperature)??"°C";return`${s} ${i}`},_s=(e,t=Date.now())=>{if(typeof e!="string")return null;const o=new Date(e).getTime()-t;return o>0?Math.ceil(o/6e4):null},La=e=>{const t=e==null?void 0:e.state;return t==="off"||t==="unavailable"||t==="unknown"},lo=e=>{switch(e==null?void 0:e.state){case"heat":return"var(--state-climate-heat-color, #ff5722)";case"cool":return"var(--state-climate-cool-color, #2196f3)";case"heat_cool":return"var(--state-climate-heat-cool-color, var(--state-climate-heat-color, #ffb300))";case"auto":return"var(--state-climate-auto-color, #4caf50)";case"dry":return"var(--state-climate-dry-color, #ff9800)";case"fan_only":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-inactive-color, var(--disabled-color, #9e9e9e))"}},co=e=>{const t=e==null?void 0:e.attributes.hvac_action;if(!(!t||t==="idle"||t==="off"||La(e)))switch(t){case"cooling":return"var(--state-climate-cool-color, #2196f3)";case"drying":return"var(--state-climate-dry-color, #ff9800)";case"fan":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-climate-heat-color, #ff5722)"}},vs=(e,t)=>{var s,i;const o=t==null?void 0:t.attributes.target_temp_step;return o||(((i=(s=e==null?void 0:e.config)==null?void 0:s.unit_system)==null?void 0:i.temperature)==="°F"?1:.5)},uo=e=>{var t;return((t=e.toString().split(".")[1])==null?void 0:t.length)??0},ys=(e,t,{digits:o,unit:s,signed:i=!1})=>{if(t==null)return d`<span class="big"><span class="int">—</span></span>`;const a=new Intl.NumberFormat(U(e),{minimumFractionDigits:o,maximumFractionDigits:o,...i?{signDisplay:"exceptZero"}:{}}).format(t),n=a.includes(".")?a.split(".")[0]:a.split(",")[0],r=a.slice(n.length);return d`
    <span class="big">
      <span class="int">${n}</span>
      <span class="addon">
        <span class="decimal">${r}</span>
        <span class="unit">${s}</span>
      </span>
    </span>
  `};var Ha="M18 16H14V18H18V20L21 17L18 14V16M11 4C8.8 4 7 5.8 7 8S8.8 12 11 12 15 10.2 15 8 13.2 4 11 4M11 14C6.6 14 3 15.8 3 18V20H12.5C12.2 19.2 12 18.4 12 17.5C12 16.3 12.3 15.2 12.9 14.1C12.3 14.1 11.7 14 11 14",Da="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",Va="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16",Pa="M6 14H9L5 18L1 14H4C4 11.3 5.7 6.6 11 6.1V8.1C7.6 8.6 6 11.9 6 14M20 14C20 11.3 18.3 6.6 13 6.1V8.1C16.4 8.7 18 11.9 18 14H15L19 18L23 14H20Z",Ba="M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ia="M16,18H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ra="M16,17H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",ja="M16,15H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Na="M16,14H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ua="M16,13H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Fa="M16,12H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ka="M16,10H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ga="M16,9H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Wa="M16,8H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",qa="M14 20H6V6H14M14.67 4H13V2H7V4H5.33C4.6 4 4 4.6 4 5.33V20.67C4 21.4 4.6 22 5.33 22H14.67C15.4 22 16 21.4 16 20.67V5.33C16 4.6 15.4 4 14.67 4M21 7H19V13H21V8M21 15H19V17H21V15Z",Za="M16,20H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",Ya="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z",Ja="M14,4L16.29,6.29L13.41,9.17L14.83,10.59L17.71,7.71L20,10V4M10,4H4V10L6.29,7.71L11,12.41V20H13V11.59L7.71,6.29",Xa="M9 17H7V10H9V17M13 17H11V7H13V17M17 17H15V13H17V17M19 19H5V5H19V19.1M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z",Qa="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",en="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z",tn="M12 8L15 13.2L18 10.5L17.3 14H6.7L6 10.5L9 13.2L12 8M12 4L8.5 10L3 5L5 16H19L21 5L15.5 10L12 4M19 18H5V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V18Z",on="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",sn="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",an="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z",nn="M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z",rn="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",ln="M4,1C2.89,1 2,1.89 2,3V7C2,8.11 2.89,9 4,9H1V11H13V9H10C11.11,9 12,8.11 12,7V3C12,1.89 11.11,1 10,1H4M4,3H10V7H4V3M14,13C12.89,13 12,13.89 12,15V19C12,20.11 12.89,21 14,21H11V23H23V21H20C21.11,21 22,20.11 22,19V15C22,13.89 21.11,13 20,13H14M3.88,13.46L2.46,14.88L4.59,17L2.46,19.12L3.88,20.54L6,18.41L8.12,20.54L9.54,19.12L7.41,17L9.54,14.88L8.12,13.46L6,15.59L3.88,13.46M14,15H20V19H14V15Z",cn="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",dn="M14,19H18V5H14M6,19H10V5H6V19Z",un="M3 7H6V4H8V7H11V9H8V12H6V9H3V7M13 15H21V17H13V15M16.04 3H18.35L7.96 21H5.65L16.04 3Z",hn="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13",mn="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z",pn="M13.13 22.19L11.5 18.36C13.07 17.78 14.54 17 15.9 16.09L13.13 22.19M5.64 12.5L1.81 10.87L7.91 8.1C7 9.46 6.22 10.93 5.64 12.5M21.61 2.39C21.61 2.39 16.66 .269 11 5.93C8.81 8.12 7.5 10.53 6.65 12.64C6.37 13.39 6.56 14.21 7.11 14.77L9.24 16.89C9.79 17.45 10.61 17.63 11.36 17.35C13.5 16.53 15.88 15.19 18.07 13C23.73 7.34 21.61 2.39 21.61 2.39M14.54 9.46C13.76 8.68 13.76 7.41 14.54 6.63S16.59 5.85 17.37 6.63C18.14 7.41 18.15 8.68 17.37 9.46C16.59 10.24 15.32 10.24 14.54 9.46M8.88 16.53L7.47 15.12L8.88 16.53M6.24 22L9.88 18.36C9.54 18.27 9.21 18.12 8.91 17.91L4.83 22H6.24M2 22H3.41L8.18 17.24L6.76 15.83L2 20.59V22M2 19.17L6.09 15.09C5.88 14.79 5.73 14.47 5.64 14.12L2 17.76V19.17Z",fn="M20.79,13.95L18.46,14.57L16.46,13.44V10.56L18.46,9.43L20.79,10.05L21.31,8.12L19.54,7.65L20,5.88L18.07,5.36L17.45,7.69L15.45,8.82L13,7.38V5.12L14.71,3.41L13.29,2L12,3.29L10.71,2L9.29,3.41L11,5.12V7.38L8.5,8.82L6.5,7.69L5.92,5.36L4,5.88L4.47,7.65L2.7,8.12L3.22,10.05L5.55,9.43L7.55,10.56V13.45L5.55,14.58L3.22,13.96L2.7,15.89L4.47,16.36L4,18.12L5.93,18.64L6.55,16.31L8.55,15.18L11,16.62V18.88L9.29,20.59L10.71,22L12,20.71L13.29,22L14.7,20.59L13,18.88V16.62L15.5,15.17L17.5,16.3L18.12,18.63L20,18.12L19.53,16.35L21.3,15.88L20.79,13.95M9.5,10.56L12,9.11L14.5,10.56V13.44L12,14.89L9.5,13.44V10.56Z",bn="M12.92 1.58L11.18 2.58L12.39 4.67L11.8 6.85L9 7.6L7.38 6L7.42 3.59L5.43 3.59L5.43 5.42L3.59 5.42L3.6 7.42L6 7.42L7.65 9.03L6.9 11.82L4.68 12.4L2.59 11.2L1.59 12.93L3.17 13.84L2.26 15.42L4 16.42L5.19 14.33L7.42 13.75L7.92 14.26L9.32 12.86L8.78 12.32L9.53 9.54L12.32 8.78L12.85 9.32L14.26 7.91L13.73 7.37L14.32 5.19L16.41 4L15.41 2.25L13.83 3.16L12.92 1.58M20.72 4L4 20.72L5.27 22L10.16 17.11C10.63 17.43 11.15 17.68 11.71 17.83C14.38 18.55 17.12 16.96 17.83 14.29C18.22 12.86 17.93 11.36 17.11 10.16L22 5.27L20.72 4M18.74 9C19.18 9.63 19.53 10.38 19.75 11.19C19.97 12 20.03 12.81 19.96 13.61L22.65 10.41L18.74 9M19.32 15.95C19 16.67 18.5 17.35 17.93 17.94C17.34 18.53 16.66 19 15.96 19.34L20.05 20.06L19.32 15.95M9 18.71L10.41 22.66L13.59 19.95C12.81 20 12 19.97 11.19 19.76C10.36 19.54 9.62 19.17 9 18.71Z",gn="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z",_n="M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",vn="M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z",yn="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22C12.4 22 12.7 22 13.1 21.9L15.4 15.3L14.8 14.7C15.5 14 16 13 16 11.9C16 11.2 15.8 10.5 15.4 9.9L17.6 7.7C18.5 9 19 10.4 19 12H20C20.3 12 20.6 12.1 20.8 12.2C20.8 12.2 20.9 12.2 20.9 12.3C21.3 12.5 21.7 12.9 21.9 13.4C22 12.9 22 12.5 22 12C22 6.5 17.5 2 12 2M14 8.6C13.4 8.2 12.7 8 12 8C9.8 8 8 9.8 8 12C8 13.1 8.4 14.1 9.2 14.8L7.1 16.9C5.8 15.7 5 13.9 5 12C5 8.1 8.1 5 12 5C13.6 5 15 5.5 16.2 6.4L14 8.6M20 14H18L14.8 23H16.7L17.4 21H20.6L21.3 23H23.2L20 14M17.8 19.7L19 16L20.2 19.7H17.8Z",wn="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z",kn="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z",$n="M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z",xn="M21 20V2H3V20H1V23H23V20M19 4V11H17V4M5 4H7V11H5M5 20V13H7V20M9 20V4H15V20M17 20V13H19V20Z";const xt=_n,An=vn,Cn=mn,Ue=$n,Sn=on,On=Xa,En=en,Mn=Qa,zn=un,Tn=an,Ln=fn,ws=hn,ks=sn,Hn=bn,Dn=yn,$s=kn,xs=Pa,ho=xn,As=Ha,Cs=pn,Vn=wn,mo=cn,Ss=ln,Pn=Da,Os=Va,Bn=rn,In=tn,po=Ya,Rn=dn,fo=gn,Es=nn,jn=Ja,Nn=qa,Un={10:Ia,20:Ra,30:ja,40:Na,50:Ua,60:Fa,70:Ka,80:Ga,90:Wa,100:Ba},Ms=e=>e<=5?Za:Un[Math.min(100,Math.round(e/10)*10)],zs=e=>{switch(e){case"cool":return Ln;case"dry":return Ue;case"fan_only":return ks;case"auto":return Dn;case"heat":return Tn;case"off":return ws;case"heat_cool":return Hn;default:return xt}},Fn=1e4;class bo{constructor(t,o=(s,i)=>s==null?void 0:s.attributes[i]){this.host=t,this.read=o,this._values={},t.addController(this)}get(t){return this._values[t]}set(t){this._values={...this._values,...t},clearTimeout(this._timer),this._timer=setTimeout(()=>this.clear(),Fn),this.host.requestUpdate()}sync(t,o){for(const s of Object.keys(this._values))((t==null?void 0:t.entity_id)!==(o==null?void 0:o.entity_id)||this.read(t,s)!==this.read(o,s))&&delete this._values[s]}clear(){clearTimeout(this._timer),this._timer=void 0,this._values={},this.host.requestUpdate()}hostDisconnected(){this.clear()}}const Ts=C`
  .tile {
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px 6px 8px;
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    /* Follows a rounder card (--cgh-surface-radius); a radius past half the
       height draws a pill. */
    border-radius: var(--cgh-surface-radius, var(--ha-border-radius-lg, 16px));
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
`,Ls=C`
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
`,go=C`
  .dial.no-buttons {
    margin-bottom: calc(min(100%, var(--cgh-content-width, 320px)) * -0.125);
  }
`,Hs=C`
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
`,Ds=C`
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
`;var Kn=Object.defineProperty,Gn=Object.getOwnPropertyDescriptor,Fe=(e,t,o,s)=>{for(var i=s>1?void 0:s?Gn(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&Kn(t,o,i),i};const Wn=1,qn=2;let me=class extends S{constructor(){super(...arguments),this.buttons=!0,this._bound="low",this._pending=new bo(this)}willUpdate(e){e.has("stateObj")&&this._pending.sync(e.get("stateObj"),this.stateObj)}_target(e){var t;return this._pending.get(e)??((t=this.stateObj)==null?void 0:t.attributes[e])}get _min(){var e;return((e=this.stateObj)==null?void 0:e.attributes.min_temp)??5}get _max(){var e;return((e=this.stateObj)==null?void 0:e.attributes.max_temp)??35}get _features(){var e;return((e=this.stateObj)==null?void 0:e.attributes.supported_features)??0}get _supportsTemperature(){var e;return(this._features&Wn)!==0&&((e=this.stateObj)==null?void 0:e.attributes.temperature)!=null}get _supportsRange(){var e,t;return(this._features&qn)!==0&&((e=this.stateObj)==null?void 0:e.attributes.target_temp_low)!=null&&((t=this.stateObj)==null?void 0:t.attributes.target_temp_high)!=null}get _step(){return vs(this.hass,this.stateObj)}get _digits(){return uo(this._step)}get _unit(){var e,t,o,s;return((o=(t=(e=this.hass)==null?void 0:e.config)==null?void 0:t.unit_system)==null?void 0:o.temperature)??((s=this.stateObj)==null?void 0:s.attributes.unit_of_measurement)??""}get _mode(){var s,i;const e=(s=this.stateObj)==null?void 0:s.state,t=(((i=this.stateObj)==null?void 0:i.attributes.hvac_modes)??[]).filter(a=>a==="heat"||a==="cool"||a==="heat_cool"),o=t.length===1&&(e==="auto"||e==="off")?t[0]:e;return o==="heat"?"start":o==="cool"?"end":"full"}get _inactive(){var t;const e=(t=this.stateObj)==null?void 0:t.state;return e==="off"||e==="unavailable"||e==="unknown"}_big(e){return ys(this.hass,e,{digits:this._digits,unit:this._unit})}_send(e){!this.hass||!this.stateObj||(this._pending.set(e),this.hass.callService("climate","set_temperature",{entity_id:this.stateObj.entity_id,...e}))}_setSingle(e){this._send({temperature:e})}_setRange(e,t){this._send({target_temp_low:e,target_temp_high:t})}_onStep(e){const t=o=>wt(o+e.detail.direction*this._step,this._min,this._max,this._step);if(this._supportsRange){const o=this._target("target_temp_low"),s=this._target("target_temp_high");if(this._bound==="low"){const i=t(o);i!==o&&i<=s&&this._setRange(i,s)}else{const i=t(s);i!==s&&i>=o&&this._setRange(o,i)}}else if(this._supportsTemperature){const o=this._target("temperature"),s=t(o);s!==o&&this._setSingle(s)}}_renderInfo(e,t,o,s,i){var u,p,f;const a=bs(this.hass,(u=this.stateObj)==null?void 0:u.attributes.hvac_action,(p=this.stateObj)==null?void 0:p.state),n=(f=this.stateObj)==null?void 0:f.attributes.current_humidity,r=co(this.stateObj),l=he(r?{color:r}:{});return d`
      <div class="overlay">
        ${a?d`<div class="action" style=${l}>${a}</div>`:c}
        ${e?d`<div class="range">
                <button
                  class="bound ${this._bound==="low"?"sel":""}"
                  @click=${()=>this._bound="low"}
                >
                  ${this._big(s)}
                </button>
                <button
                  class="bound ${this._bound==="high"?"sel":""}"
                  @click=${()=>this._bound="high"}
                >
                  ${this._big(i)}
                </button>
              </div>`:d`<div class="primary">${this._big(o)}</div>`}
        ${t!=null||n!=null?d`<div class="secondary" style=${l}>
                ${t!=null?d`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${xt} />
                        </svg>
                        ${new Intl.NumberFormat(U(this.hass),{maximumFractionDigits:1}).format(t)}
                        ${this._unit}
                      </span>`:c}
                ${t!=null&&n!=null?d`<span class="sep">·</span>`:c}
                ${n!=null?d`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${Ue} />
                        </svg>
                        ${new Intl.NumberFormat(U(this.hass),{maximumFractionDigits:0}).format(n)}
                        %
                      </span>`:c}
              </div>`:c}
      </div>
    `}render(){if(!this.stateObj)return c;const t=this.stateObj.attributes.current_temperature,o=this._supportsRange,s=!o&&this._supportsTemperature,i=o?this._target("target_temp_low"):void 0,a=o?this._target("target_temp_high"):void 0,n=s?this._target("temperature"):void 0;return d`
      <div
        class="wrap"
        style=${he({"--cgh-slider-color":lo(this.stateObj),"--cgh-slider-low":"var(--state-climate-heat-color, #ff5722)","--cgh-slider-high":"var(--state-climate-cool-color, #2196f3)","--cgh-action-color":co(this.stateObj)??"transparent"})}
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
            .value=${n??c}
            .low=${i??c}
            .high=${a??c}
            .current=${t??c}
            .disabled=${!s&&!o}
            @value-changed=${r=>r.detail.value!=null&&this._setSingle(r.detail.value)}
            @low-changing=${()=>this._bound="low"}
            @high-changing=${()=>this._bound="high"}
            @low-changed=${r=>{const l=r.detail.value;l!=null&&a!=null&&this._setRange(l,a)}}
            @high-changed=${r=>{const l=r.detail.value;l!=null&&i!=null&&this._setRange(i,l)}}
          ></cgh-circular-slider>

          ${this._renderInfo(o,t,n,i,a)}
          ${this.buttons&&(s||o)?d`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .color=${o&&!this._inactive?this._bound==="high"?"var(--state-climate-cool-color, #2196f3)":"var(--state-climate-heat-color, #ff5722)":void 0}
                    @cgh-step=${this._onStep}
                  ></cgh-number-buttons>
                </div>`:c}
        </div>
      </div>
    `}};me.styles=[Ls,Hs,go,C`
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
  `],Fe([m({attribute:!1})],me.prototype,"hass",2),Fe([m({attribute:!1})],me.prototype,"stateObj",2),Fe([m({type:Boolean})],me.prototype,"buttons",2),Fe([D()],me.prototype,"_bound",2),me=Fe([L("cgh-climate-temperature")],me);var Zn=Object.defineProperty,Yn=Object.getOwnPropertyDescriptor,At=(e,t,o,s)=>{for(var i=s>1?void 0:s?Yn(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&Zn(t,o,i),i};let Se=class extends Y(S){constructor(){super(...arguments),this.buttons=!0,this._pending=new bo(this)}willUpdate(e){e.has("stateObj")&&this._pending.sync(e.get("stateObj"),this.stateObj)}get _target(){var e;return this._pending.get("humidity")??((e=this.stateObj)==null?void 0:e.attributes.humidity)}get _current(){var e;return(e=this.stateObj)==null?void 0:e.attributes.current_humidity}get _min(){var e;return((e=this.stateObj)==null?void 0:e.attributes.min_humidity)??0}get _max(){var e;return((e=this.stateObj)==null?void 0:e.attributes.max_humidity)??100}get _step(){var e;return((e=this.stateObj)==null?void 0:e.attributes.target_humidity_step)??1}get _inactive(){var t;const e=(t=this.stateObj)==null?void 0:t.state;return e==="off"||e==="unavailable"||e==="unknown"}_color(){return this._inactive?"var(--state-inactive-color, var(--disabled-color, #9e9e9e))":"var(--state-humidifier-on-color, #2196f3)"}_set(e){!this.hass||!this.stateObj||(this._pending.set({humidity:e}),this.hass.callService("climate","set_humidity",{entity_id:this.stateObj.entity_id,humidity:e}))}_onStep(e){const t=this._target;if(t==null)return;const o=wt(t+e.detail.direction*this._step,this._min,this._max,this._step);o!==t&&this._set(o)}_format(e){return new Intl.NumberFormat(U(this.hass),{maximumFractionDigits:0}).format(e)}render(){if(!this.stateObj)return c;const e=this._target,t=this._current;return d`
      <div
        class="wrap"
        style=${he({"--cgh-slider-color":this._color()})}
      >
        <div class="dial ${this.buttons?"":"no-buttons"}">
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${"start"}
            .inactive=${this._inactive}
            .value=${e??c}
            .current=${t??c}
            @value-changed=${o=>o.detail.value!=null&&this._set(o.detail.value)}
          ></cgh-circular-slider>

          <div class="overlay">
            <div class="action">${this.t("humidity.target")}</div>
            ${e!=null?d`<div class="primary">
                    <span class="int">${this._format(e)}</span
                    ><span class="unit">%</span>
                  </div>`:c}
            ${t!=null?d`<div class="secondary">
                    <svg viewBox="0 0 24 24">
                      <path d=${Ue} />
                    </svg>
                    ${this._format(t)} %
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
    `}};Se.styles=[go,C`
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
  `],At([m({attribute:!1})],Se.prototype,"hass",2),At([m({attribute:!1})],Se.prototype,"stateObj",2),At([m({type:Boolean})],Se.prototype,"buttons",2),Se=At([L("cgh-climate-humidity")],Se);var Jn=Object.defineProperty,Xn=Object.getOwnPropertyDescriptor,Ke=(e,t,o,s)=>{for(var i=s>1?void 0:s?Xn(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&Jn(t,o,i),i};const Qn=-5,er=5,tr=.5;let pe=class extends Y(S){constructor(){super(...arguments),this.buttons=!0,this._pending=new bo(this,e=>e==null?void 0:e.state)}willUpdate(e){e.has("offsetObj")&&this._pending.sync(e.get("offsetObj"),this.offsetObj)}get _target(){var t;const e=Number((t=this.offsetObj)==null?void 0:t.state);if(Number.isFinite(e))return this._pending.get("value")??e}_attr(e,t){var s;const o=(s=this.offsetObj)==null?void 0:s.attributes[e];return typeof o=="number"?o:t}get _min(){return this._attr("min",Qn)}get _max(){return this._attr("max",er)}get _step(){return this._attr("step",tr)}get _digits(){return uo(this._step)}get _temperatureUnit(){var e,t,o,s;return((o=(t=(e=this.hass)==null?void 0:e.config)==null?void 0:t.unit_system)==null?void 0:o.temperature)??((s=this.stateObj)==null?void 0:s.attributes.unit_of_measurement)??""}get _unit(){var e,t,o,s;return((e=this.offsetObj)==null?void 0:e.attributes.unit_of_measurement)??((s=(o=(t=this.hass)==null?void 0:t.config)==null?void 0:o.unit_system)==null?void 0:s.temperature)??"°C"}_set(e){!this.hass||!this.offsetObj||this._target==null||(this._pending.set({value:e}),this.hass.callService("number","set_value",{entity_id:this.offsetObj.entity_id,value:e}))}_onStep(e){const t=this._target;if(t==null)return;const o=wt(t+e.detail.direction*this._step,this._min,this._max,this._step);o!==t&&this._set(o)}_renderTarget(){var l;const e=(l=this.stateObj)==null?void 0:l.attributes,t=e==null?void 0:e.temperature,o=e==null?void 0:e.target_temp_low,s=e==null?void 0:e.target_temp_high,i=uo(vs(this.hass,this.stateObj)),a=u=>new Intl.NumberFormat(U(this.hass),{minimumFractionDigits:i,maximumFractionDigits:i}).format(u),n=this._temperatureUnit;let r;return t!=null?r=`${a(t)} ${n}`:o!=null&&s!=null&&(r=`${a(o)}–${a(s)} ${n}`),r===void 0?c:d`<div class="target">
      <svg viewBox="0 0 24 24"><path d=${An} /></svg>
      ${r}
    </div>`}_renderReadings(e){var s,i;const t=(s=this.stateObj)==null?void 0:s.attributes.current_temperature,o=(i=this.stateObj)==null?void 0:i.attributes.current_humidity;return t==null&&o==null?c:d`<div class="secondary" style=${he(e?{color:e}:{})}>
      ${t!=null?d`<span class="reading">
              <svg viewBox="0 0 24 24"><path d=${xt} /></svg>
              ${new Intl.NumberFormat(U(this.hass),{maximumFractionDigits:1}).format(t)}
              ${this._temperatureUnit}
            </span>`:c}
      ${t!=null&&o!=null?d`<span class="sep">·</span>`:c}
      ${o!=null?d`<span class="reading">
              <svg viewBox="0 0 24 24"><path d=${Ue} /></svg>
              ${new Intl.NumberFormat(U(this.hass),{maximumFractionDigits:0}).format(o)}
              %
            </span>`:c}
    </div>`}render(){if(!this.stateObj||!this.offsetObj)return c;const e=this._target,t=co(this.stateObj);return d`
      <div
        class="wrap"
        style=${he({"--cgh-slider-color":lo(this.stateObj),"--cgh-action-color":t??"transparent"})}
      >
        <div class="dial ${this.buttons?"":"no-buttons"}">
          <div class="glow"></div>
          <cgh-circular-slider
            .min=${this._min}
            .max=${this._max}
            .step=${this._step}
            .mode=${"origin"}
            .origin=${0}
            .value=${e??c}
            .disabled=${e==null}
            @value-changed=${o=>o.detail.value!=null&&this._set(o.detail.value)}
          ></cgh-circular-slider>

          <div class="overlay">
            <div class="action" style=${he(t?{color:t}:{})}>
              ${this.t("offset.label")}
            </div>
            <div class="primary">
              ${ys(this.hass,e,{digits:this._digits,unit:this._unit,signed:!0})}
            </div>
            ${this._renderTarget()}
            ${this._renderReadings(t)}
          </div>

          ${this.buttons?d`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .disabled=${e==null}
                    @cgh-step=${this._onStep}
                  ></cgh-number-buttons>
                </div>`:c}
        </div>
      </div>
    `}};pe.styles=[Ls,Hs,go,C`
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
    `],Ke([m({attribute:!1})],pe.prototype,"hass",2),Ke([m({attribute:!1})],pe.prototype,"stateObj",2),Ke([m({attribute:!1})],pe.prototype,"offsetObj",2),Ke([m({type:Boolean})],pe.prototype,"buttons",2),pe=Ke([L("cgh-climate-offset")],pe);var or=Object.defineProperty,sr=Object.getOwnPropertyDescriptor,fe=(e,t,o,s)=>{for(var i=s>1?void 0:s?sr(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&or(t,o,i),i};const ir=4,Vs={offset:{icon:zn,label:"offset.label"},temperature:{icon:xt,label:"common.temperature"},humidity:{icon:Ue,label:"common.humidity"}};let J=class extends Y(S){constructor(){super(...arguments),this.controls=["slider","buttons"],this.views=["offset","temperature","humidity"],this._view="temperature"}get _hasHumidity(){var t;return((((t=this.stateObj)==null?void 0:t.attributes.supported_features)??0)&ir)!==0}get _views(){const e={offset:!!this.offsetObj,temperature:!0,humidity:this._hasHumidity},t=["offset","temperature","humidity"].filter(o=>this.views.includes(o)&&e[o]);return t.length?t:["temperature"]}_dial(e,t){switch(e){case"offset":return d`<cgh-climate-offset
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .offsetObj=${this.offsetObj}
          .buttons=${t}
        ></cgh-climate-offset>`;case"humidity":return d`<cgh-climate-humidity
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .buttons=${t}
        ></cgh-climate-humidity>`;default:return d`<cgh-climate-temperature
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          .buttons=${t}
        ></cgh-climate-temperature>`}}render(){const e=this.controls.includes("slider"),t=this._views,o=e&&t.length>=2,s=t.includes("temperature")?"temperature":t[0],i=o&&t.includes(this._view)?this._view:s;return e?d`
      <div class="control">
        ${this._dial(i,this.controls.includes("buttons"))}
        ${o?d`<div class="toggle">
                ${t.map(a=>d`<button
                    class="seg ${a} ${i===a?"active":""}"
                    aria-label=${this.t(Vs[a].label)}
                    @click=${()=>this._view=a}
                  >
                    <svg viewBox="0 0 24 24"><path d=${Vs[a].icon} /></svg>
                  </button>`)}
              </div>`:c}
      </div>
    `:c}};J.styles=C`
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
  `,fe([m({attribute:!1})],J.prototype,"hass",2),fe([m({attribute:!1})],J.prototype,"stateObj",2),fe([m({attribute:!1})],J.prototype,"controls",2),fe([m({attribute:!1})],J.prototype,"offsetObj",2),fe([m({attribute:!1})],J.prototype,"views",2),fe([D()],J.prototype,"_view",2),J=fe([L("cgh-climate-control")],J);const Ct=["panel","badges","deviations"],St=["slider","buttons"],Ge=["offset","temperature","humidity"],We=["mode","preset","fan","swing","swing_horizontal"],Ot=["boost","offset","schedule","bypass","fallback","presets"],Ps={boost:"reset.boost",offset:"reset.offset",schedule:"reset.schedule",bypass:"reset.bypass",fallback:"reset.fallback",presets:"reset.presets"},Bs=["boost","offset","schedule","bypass"],qe=(e,t,o=t)=>e===!1?[]:Array.isArray(e)?t.filter(s=>e.includes(s)):[...o],_o=e=>(e==null?void 0:e.status)===!1?null:qe(e==null?void 0:e.status,Ct),vo=e=>qe(e==null?void 0:e.features,We),yo=e=>qe(e==null?void 0:e.views,Ge),Is=e=>(e==null?void 0:e.title)!==!1,Rs=e=>(e==null?void 0:e.more_info)!==!1,js=e=>(e==null?void 0:e.history)!==!1,Ns=e=>(e==null?void 0:e.settings)!==!1,wo=e=>(e==null?void 0:e.battery)!==!1,ko=e=>(e==null?void 0:e.deviations_badge)!==!1,$o=e=>qe(e==null?void 0:e.controls,St),Us=(e,t)=>{var o,s,i;return((i=(s=(o=e==null?void 0:e.states)==null?void 0:o[t])==null?void 0:s.attributes)==null?void 0:i.enabled_features)!==void 0},ar=e=>{var t;return((t=e==null?void 0:e.attributes)==null?void 0:t.effective_sync_mode)!==void 0},Fs=e=>(e==null?void 0:e.main_switch)!==!1,Et=e=>qe(e==null?void 0:e.reset,Ot,Bs),nr=e=>Et(e).length>0,Ks=30,xo=480,Ao=e=>e==="°F",Co=e=>({temperature_offset:Ao(e)?4:2,duration:Ks}),Gs=e=>Ao(e)?75:24,Ws=e=>Ao(e)?{temperature_offset:[-36,36],temperature:[41,95]}:{temperature_offset:[-20,20],temperature:[5,35]},So=e=>(e==null?void 0:e.boost)!==!1,qs=(e,t)=>{const o=e==null?void 0:e.boost;return o===void 0?Co(t):typeof o=="object"&&o!==null&&!Array.isArray(o)?o:{}},Zs=(e,t)=>{if(!So(e))return null;const o=qs(e,t),{temperature_offset:s,temperature:i,duration:a}=o;if(!(typeof a=="number"&&Number.isInteger(a)&&a>=1&&a<=xo))return null;const n=Ws(t),r=(l,[u,p])=>typeof l=="number"&&Number.isFinite(l)&&l>=u&&l<=p;return s!==void 0&&i===void 0&&r(s,n.temperature_offset)?{temperature_offset:s,duration:a}:i!==void 0&&s===void 0&&r(i,n.temperature)?{temperature:i,duration:a}:null};var rr=Object.defineProperty,lr=Object.getOwnPropertyDescriptor,Ze=(e,t,o,s)=>{for(var i=s>1?void 0:s?lr(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&rr(t,o,i),i};let be=class extends S{constructor(){super(...arguments),this.label="",this.description="",this.active=!1}_tap(){this.dispatchEvent(new CustomEvent("cgh-action",{bubbles:!0,composed:!0}))}render(){const e=this.description||this.label;return d`
      <button
        class="tile ${this.active?"active":""}"
        title=${e}
        aria-label=${e}
        @click=${this._tap}
      >
        ${this.icon?d`<span class="chip"
                ><svg viewBox="0 0 24 24"><path d=${this.icon} /></svg
              ></span>`:c}
        <span class="label">${this.label}</span>
      </button>
    `}};be.styles=[Ts,C`
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
    `],Ze([m()],be.prototype,"icon",2),Ze([m()],be.prototype,"label",2),Ze([m()],be.prototype,"description",2),Ze([m({type:Boolean})],be.prototype,"active",2),be=Ze([L("cgh-action-tile")],be);var cr=Object.defineProperty,dr=Object.getOwnPropertyDescriptor,N=(e,t,o,s)=>{for(var i=s>1?void 0:s?dr(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&cr(t,o,i),i};let V=class extends S{constructor(){super(...arguments),this.label="",this.options=[],this.disabled=!1,this.reselect=!1,this.active=!1,this._open=!1,this._up=!1,this._onDocumentClick=e=>{e.composedPath().includes(this)||(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick)}get _valueLabel(){var e;return((e=this.options.find(t=>t.value===this.value))==null?void 0:e.label)??this.value??""}_toggle(){if(this.disabled)return;if(this._open){this._open=!1;return}const e=this.getBoundingClientRect(),t=Math.min(this.options.length*48+8,400),o=window.innerHeight-e.bottom;this._up=o<t&&e.top>o,this._open=!0}_select(e){this._open=!1,!(e===this.value&&!this.reselect)&&this.dispatchEvent(new CustomEvent("cgh-select",{detail:{value:e},bubbles:!0,composed:!0}))}render(){return d`
      <div class="wrap">
        <button
          class="tile ${this.active?"active":""} ${this.accent?"accented":""}"
          style=${this.accent?`--accent: ${this.accent}`:""}
          title=${`${this.label}: ${this._valueLabel}`}
          ?disabled=${this.disabled}
          @click=${this._toggle}
        >
          ${this.icon?d`<span class="chip"
                  ><svg viewBox="0 0 24 24"><path d=${this.icon} /></svg
                ></span>`:c}
          <span class="content">
            <span class="label">${this.label}</span>
            <span class="value">${this._valueLabel}</span>
          </span>
        </button>
        ${this._open?d`<div class="menu ${this._up?"up":""}" role="listbox">
                ${this.options.map(e=>d`<button
                    class="option ${e.value===this.value?"selected":""}"
                    role="option"
                    aria-selected=${e.value===this.value}
                    @click=${()=>this._select(e.value)}
                  >
                    ${e.icon?d`<svg viewBox="0 0 24 24">
                            <path d=${e.icon} />
                          </svg>`:c}
                    <span>${e.label}</span>
                  </button>`)}
              </div>`:c}
      </div>
    `}};V.styles=[Ts,C`
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
  `],N([m()],V.prototype,"icon",2),N([m()],V.prototype,"label",2),N([m()],V.prototype,"value",2),N([m({attribute:!1})],V.prototype,"options",2),N([m({type:Boolean})],V.prototype,"disabled",2),N([m({type:Boolean})],V.prototype,"reselect",2),N([m()],V.prototype,"accent",2),N([m({type:Boolean})],V.prototype,"active",2),N([D()],V.prototype,"_open",2),N([D()],V.prototype,"_up",2),V=N([L("cgh-select-tile")],V);var ur=Object.defineProperty,hr=Object.getOwnPropertyDescriptor,Oe=(e,t,o,s)=>{for(var i=s>1?void 0:s?hr(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&ur(t,o,i),i};const mr=8,pr=16,fr=32,br=512,gr=e=>["off","unavailable","unknown"].includes(e.state)?void 0:lo(e),Ye={mode:["off"],preset:["none"],fan:["auto","off"],swing:["off"]},Je=(e,t,o)=>typeof e=="string"&&t.includes(e)&&t.some(s=>o.includes(s))&&!o.includes(e);let se=class extends Y(S){constructor(){super(...arguments),this.tiles=["mode","preset","fan","swing","swing_horizontal"],this.boost=null,this.reset=[]}_call(e,t){!this.hass||!this.stateObj||this.hass.callService("climate",e,{entity_id:this.stateObj.entity_id,...t})}get _boostActive(){var e;return!!((e=this.stateObj)!=null&&e.attributes.boost_until)}_boost(){if(!(!this.hass||!this.stateObj||!this.boost)){if(this._boostActive){this.hass.callService("climate_group_helper","reset",{entity_id:this.stateObj.entity_id,boost:!0});return}this.hass.callService("climate_group_helper","boost",{entity_id:this.stateObj.entity_id,...this.boost})}}_temperature(e){var s,i,a;const t=((a=(i=(s=this.hass)==null?void 0:s.config)==null?void 0:i.unit_system)==null?void 0:a.temperature)??"°C";return`${new Intl.NumberFormat(U(this.hass),{minimumFractionDigits:1,maximumFractionDigits:1}).format(e)} ${t}`}_boostDescription(){var i;const e=this.t("boost.label"),t=(i=this.stateObj)==null?void 0:i.attributes;if(this._boostActive){const a=t==null?void 0:t.boost_temperature;return a==null?e:`${e}: ${this.t("boost.running",{temperature:this._temperature(a),time:no(t.boost_until,this.hass,{hour:"2-digit",minute:"2-digit"})})}`}const o=this.boost,s=o.temperature_offset!==void 0?ro(o.temperature_offset,this.hass):this._temperature(o.temperature);return`${e}: ${s} · ${this.t("boost.duration",{minutes:o.duration})}`}_reset(){!this.hass||!this.stateObj||!this.reset.length||this.hass.callService("climate_group_helper","reset",{entity_id:this.stateObj.entity_id,...Object.fromEntries(this.reset.map(e=>[e,!0]))})}_options(e,t){const o=this.stateObj;return t.map(s=>{var i,a;return{value:s,label:((a=(i=this.hass)==null?void 0:i.formatEntityAttributeValue)==null?void 0:a.call(i,o,e,s))??s}})}render(){const e=this.stateObj,t=e==null?void 0:e.attributes;if(!e||!t)return c;const o=t.supported_features??0,s=t.hvac_modes??[],i=t.preset_modes??[],a=t.fan_modes??[],n=t.swing_modes??[],r=t.swing_horizontal_modes??[],l=[this.tiles.includes("mode")&&s.length?d`<cgh-select-tile
            .icon=${zs(e.state)}
            .accent=${gr(e)}
            .active=${Je(e.state,s,Ye.mode)}
            .label=${this.t("tile.mode")}
            .value=${e.state}
            .options=${s.map(u=>({value:u,label:ao(this.hass,"mode",u),icon:zs(u)}))}
            @cgh-select=${u=>this._call("set_hvac_mode",{hvac_mode:u.detail.value})}
          ></cgh-select-tile>`:c,this.tiles.includes("preset")&&(o&pr)!==0&&i.length?d`<cgh-select-tile
            .icon=${$s}
            .label=${this.t("tile.preset")}
            .value=${t.preset_mode}
            .active=${Je(t.preset_mode,i,Ye.preset)}
            .options=${this._options("preset_mode",i)}
            .reselect=${!0}
            @cgh-select=${u=>this._call("set_preset_mode",{preset_mode:u.detail.value})}
          ></cgh-select-tile>`:c,this.tiles.includes("fan")&&(o&mr)!==0&&a.length?d`<cgh-select-tile
            .icon=${ks}
            .label=${this.t("tile.fan")}
            .value=${t.fan_mode}
            .active=${Je(t.fan_mode,a,Ye.fan)}
            .options=${this._options("fan_mode",a)}
            @cgh-select=${u=>this._call("set_fan_mode",{fan_mode:u.detail.value})}
          ></cgh-select-tile>`:c,this.tiles.includes("swing")&&(o&fr)!==0&&n.length?d`<cgh-select-tile
            .icon=${xs}
            .label=${this.t("tile.swing")}
            .value=${t.swing_mode}
            .active=${Je(t.swing_mode,n,Ye.swing)}
            .options=${this._options("swing_mode",n)}
            @cgh-select=${u=>this._call("set_swing_mode",{swing_mode:u.detail.value})}
          ></cgh-select-tile>`:c,this.tiles.includes("swing_horizontal")&&(o&br)!==0&&r.length?d`<cgh-select-tile
            .icon=${xs}
            .label=${this.t("tile.swing_horizontal")}
            .value=${t.swing_horizontal_mode}
            .active=${Je(t.swing_horizontal_mode,r,Ye.swing)}
            .options=${this._options("swing_horizontal_mode",r)}
            @cgh-select=${u=>this._call("set_swing_horizontal_mode",{swing_horizontal_mode:u.detail.value})}
          ></cgh-select-tile>`:c,this.boost?d`<cgh-action-tile
            class="boost"
            .icon=${Cs}
            .label=${this.t("boost.label")}
            .description=${this._boostDescription()}
            .active=${this._boostActive}
            @cgh-action=${this._boost}
          ></cgh-action-tile>`:c,this.reset.length?d`<cgh-action-tile
            class="reset"
            .icon=${Cn}
            .label=${this.t("reset.label")}
            .description=${`${this.t("reset.label")}: ${this.reset.map(u=>this.t(Ps[u])).join(", ")}`}
            @cgh-action=${this._reset}
          ></cgh-action-tile>`:c].filter(u=>u!==c);return l.length?d`<div class="tiles">${l}</div>`:c}};se.styles=C`
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
  `,Oe([m({attribute:!1})],se.prototype,"hass",2),Oe([m({attribute:!1})],se.prototype,"stateObj",2),Oe([m({attribute:!1})],se.prototype,"tiles",2),Oe([m({attribute:!1})],se.prototype,"boost",2),Oe([m({attribute:!1})],se.prototype,"reset",2),se=Oe([L("cgh-feature-tiles")],se);const Oo=30,_r=70,Ys=new WeakMap,vr=e=>{let t=Ys.get(e);if(!t){t=new Map;for(const[o,s]of Object.entries(e)){if(!s.device_id)continue;const i=t.get(s.device_id);i?i.push(o):t.set(s.device_id,[o])}Ys.set(e,t)}return t},Ee=e=>e.entity_id.startsWith("binary_sensor."),yr=e=>{if(Ee(e))return e.state==="on"?0:e.state==="off"?100:void 0;const t=String(e.state).trim();if(!t)return;const o=Number(t);return Number.isFinite(o)?o:void 0},Js=(e,t)=>{var a;const o=t==null?void 0:t.entities;if(!t||!o)return[];const s=vr(o),i=[];for(const n of e){const r=(a=o[n])==null?void 0:a.device_id;if(!r)continue;const l=(s.get(r)??[]).flatMap(u=>{const p=t.states[u];if(!p||p.attributes.device_class!=="battery"||!(Ee(p)||u.startsWith("sensor.")))return[];const f=yr(p);return f===void 0?[]:[{state:p,level:f}]});l.length&&i.push([n,l])}return i},wr=(e,t)=>{const o={};for(const[s,i]of Js(e,t)){const a=i.filter(r=>r.level<Oo),n=a.find(r=>!Ee(r.state))??a[0];n&&(o[s]=n.state)}return o},Xs=(e,t,o)=>{var i;const s=(i=t==null?void 0:t.formatEntityState)==null?void 0:i.call(t,e,e.state);return s||(Ee(e)?e.state==="on"?o:e.state:`${e.state} %`)},Qs=(e,t)=>{const o={};for(const[s,i]of Js(e,t))o[s]=i.reduce((a,n)=>n.level<a.level||n.level===a.level&&Ee(a.state)&&!Ee(n.state)?n:a);return o},kr=(e,t)=>{let o;for(const[s,i]of Object.entries(Qs(e,t)))(!o||i.level<o.level)&&(o={member:s,...i});return o},ei=e=>e<Oo?"low":e<_r?"medium":"high",ti=22,oi=6,si=16,$r=(e,t)=>{const o=Math.max(1,t.length-1),s=r=>(e-r.reduce((l,u)=>l+u,0))/o,i=t.map(r=>Math.max(ti,r)),a=t.length>1&&s(i)<oi,n=a?i.map(()=>ti):i;return{compact:a,gap:Math.min(si,Math.max(oi,Math.floor(s(n))))}};class xr{constructor(t,o){this.host=t,this.row=o,this.fit={compact:!1,gap:si},t.addController(this)}hostConnected(){typeof ResizeObserver>"u"||(this._observer=new ResizeObserver(()=>this._measure()),this._observer.observe(this.host))}hostDisconnected(){var t;(t=this._observer)==null||t.disconnect(),this._observer=void 0}hostUpdated(){this._measure()}_measure(){const t=this.row(),o=t==null?void 0:t.clientWidth;if(!t||!o)return;const s=t.querySelectorAll(":scope > .badge > span"),i=$r(o,Array.from(s,a=>a.scrollWidth+1));(i.compact!==this.fit.compact||i.gap!==this.fit.gap)&&(this.fit=i,this.host.requestUpdate())}}class Ar{constructor(t,o=15e3){this.host=t,this.intervalMs=o,t.addController(this)}hostConnected(){this._timer=window.setInterval(()=>this.host.requestUpdate(),this.intervalMs)}hostDisconnected(){this._timer!==void 0&&(window.clearInterval(this._timer),this._timer=void 0)}}class ii{constructor(t,o){this.host=t,this.remaining=o,t.addController(this)}hostUpdated(){this._clear();const t=this.remaining();t>0&&(this._timer=window.setTimeout(()=>this.host.requestUpdate(),t+50))}hostDisconnected(){this._clear()}_clear(){this._timer!==void 0&&(window.clearTimeout(this._timer),this._timer=void 0)}}function Cr(e){return e==="bypass"?"status.layer_bypass":e==="fallback"?"status.layer_fallback":"source.schedule"}const Sr=["hvac_mode","preset_mode","fan_mode","swing_mode","swing_horizontal_mode","humidity"],Or=["temperature","target_temp_low","target_temp_high"],ai=.05,Er=3e3;function Mr(e){const t=e==null?void 0:e.member_divergence;return!!t&&Object.keys(t).length>0}function ni(e,t=Date.now()){return e===void 0?0:Math.max(0,e+Er-t)}function Eo(e,t){return t?{}:(e==null?void 0:e.member_divergence)??{}}function Mo(e,t,o,s,i){if(!e||(e.blocking_sources??[]).length||e.boost_until)return!1;const a=e.target_state??{},n=a[o];if(n==null||s==null)return!1;if(Or.includes(o)){if((e.enabled_features??[]).includes("range_template")||a.hvac_mode==="off")return!1;const l=e.member_offsets??{},u=Number(n)+(e.group_offset??0)+(l[t]??0);return Math.abs(Number(s)-u)>ai}if(o==="humidity")return Math.abs(Number(s)-Number(n))>ai;const r=i==null?void 0:i.hvac_modes;return o==="hvac_mode"&&Array.isArray(r)&&!r.includes(n)?!1:String(s)!==String(n)}function ri(e,t,o,s){var n,r;const i=e==null?void 0:e.states[t];return(i?o==="hvac_mode"?(n=e==null?void 0:e.formatEntityState)==null?void 0:n.call(e,i,String(s)):(r=e==null?void 0:e.formatEntityAttributeValue)==null?void 0:r.call(e,i,o,s):void 0)??String(s)}const zr=["window","presence","schedule","sync","isolation","calibration"],Tr=["switch","window","presence","boost","hold","schedule"];function Lr(e,t=Tr){for(const o of t){const s=e.find(i=>i.kind===o);if(s)return s}}function li(e,t={},o=!1){var a;const s=Eo(e,o),i=new Set;for(const[n,r]of Object.entries(s))for(const[l,u]of Object.entries(r))Mo(e,l,n,u,(a=t[l])==null?void 0:a.attributes)&&i.add(l);return[...i]}function ci(e,t,o=[],s=[],i,a=[]){return e.map(n=>{var r;return{id:n,state:((r=t[n])==null?void 0:r.state)??"unavailable",isolated:o.includes(n),oob:s.includes(n),deviates:a.includes(n),master:n===i}})}const di=e=>e==="unavailable"||e==="unknown";function Hr(e,t){return e.filter(o=>{var s;return di(((s=t[o])==null?void 0:s.state)??"unavailable")})}function ui(e){const t=e.state==="off"?"off":di(e.state)?"unavailable":"active",o=[e.isolated?"isolated":"",e.oob?"oob":"",e.deviates?"deviates":"",e.master?"master":""].filter(Boolean).join(" ");return o?`${t} ${o}`:t}var Dr=Object.defineProperty,Vr=Object.getOwnPropertyDescriptor,F=(e,t,o,s)=>{for(var i=s>1?void 0:s?Vr(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&Dr(t,o,i),i};const Pr=["temperature","target_temp_low","target_temp_high"];let B=class extends Y(S){constructor(){super(...arguments),this.members=[],this.isolated=[],this.oob=[],this.batteries={},this.navigable=!1,this._wake=new ii(this,()=>this._quietRemaining())}_quietRemaining(){return ni(this.divergenceSince)}get _divergence(){return Eo(this.group,this._quietRemaining()>0)}_deviates(e,t){var s,i;const o=this._divergence[t];return!!o&&e in o&&Mo(this.group,e,t,o[e],(i=(s=this.hass)==null?void 0:s.states[e])==null?void 0:i.attributes)}_values(e){const t=this._divergence;return Sr.filter(o=>e in(t[o]??{})).map(o=>({text:ri(this.hass,e,o,t[o][e]),label:this._attrName(e,o),deviates:this._deviates(e,o)}))}_attrName(e,t){var s,i,a;if(t==="hvac_mode")return this.t("tile.mode");const o=(s=this.hass)==null?void 0:s.states[e];return o&&((a=(i=this.hass)==null?void 0:i.formatEntityAttributeName)==null?void 0:a.call(i,o,t))||t}_name(e){var t,o;return((o=(t=this.hass)==null?void 0:t.states[e])==null?void 0:o.attributes.friendly_name)??e}_action(e){var i;const t=(i=this.hass)==null?void 0:i.states[e],o=t==null?void 0:t.attributes.hvac_action,s=o??(t==null?void 0:t.state);return!s||s==="unavailable"||s==="unknown"?this.t("member.unavailable"):bs(this.hass,o,t==null?void 0:t.state)}_openDetails(e){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:!0,composed:!0}))}render(){var t,o;if(!this.members.length)return c;const e=ci(this.members,((t=this.hass)==null?void 0:t.states)??{},this.isolated,this.oob,this.master,li(this.group,(o=this.hass)==null?void 0:o.states,this._quietRemaining()>0));return d`
      <div class="list ${this.navigable?"navigable":""}" role="list">
        ${e.map(s=>{var u,p,f,_;const i=Ta((p=(u=this.hass)==null?void 0:u.states[s.id])==null?void 0:p.attributes,this.hass),a=this._values(s.id),n=(_=(f=this.group)==null?void 0:f.member_offsets)==null?void 0:_[s.id],r=Pr.some(g=>this._deviates(s.id,g)),l=this.batteries[s.id];return d`
            <div class="member" role="listitem">
              <span class="dot ${ui(s)}"></span>
              <span class="name" title=${s.id}>${this._name(s.id)}</span>
              <span class="marks">${s.master?d`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${In} />
                  </svg>`:c}${s.isolated?d`<svg class="mark" viewBox="0 0 24 24">
                    <path d=${mo} />
                  </svg>`:c}${s.oob?d`<svg class="mark oob" viewBox="0 0 24 24">
                    <path d=${Os} />
                  </svg>`:c}</span>
              <span class="action">${this._action(s.id)}</span>
              <span class="offset">${n?ro(n,this.hass,!0):c}</span>
              <span class="target ${r?"deviates":""}"
                >${i??c}</span
              >
              <span class="battery">${l?d`<svg class=${ei(l.level)} viewBox="0 0 24 24">
                    <title>${Xs(l.state,this.hass,this.t("member.low_battery"))}</title>
                    <path d=${Ms(l.level)} />
                  </svg>`:c}</span>
              ${a.length?d`<span
                      class="values"
                      @click=${this.navigable?()=>this._openDetails(s.id):c}
                      >${a.map(g=>d`<span
                            class="value ${g.deviates?"deviates":""}"
                            title="${g.label}: ${g.text}"
                            >${g.text}</span
                          >`)}</span
                    >`:c}
              ${this.navigable?d`<button
                      class="open"
                      title=${s.id}
                      aria-label=${this.t("member.details",{name:this._name(s.id)})}
                      @click=${()=>this._openDetails(s.id)}
                    ></button>`:c}
            </div>
          `})}
      </div>
    `}};B.styles=[Ds,C`
      :host {
        display: block;
        font-size: var(--ha-font-size-s, 0.75rem);
      }
      /* One column grid shared by all rows (subgrid), so action, offset and
         target line up however many extras a row carries:
         dot | name | marks | action | offset | target | battery.
         The menu sizes itself to this content, so the name column must report
         its real width (max-content), not 0. When the menu hits its maximum
         width, a name gives way only down to its minimum. */
      .list {
        display: grid;
        grid-template-columns: auto minmax(auto, max-content) auto auto auto auto auto;
        row-gap: 3px;
      }
      /* A faint line between two devices, centred in the gap, so a values
         line clearly belongs to the device above it. Outside the row's box:
         the hover tint does not cover it. */
      .member + .member::before {
        content: '';
        position: absolute;
        top: -2px;
        left: 6px;
        right: 6px;
        height: 1px;
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        pointer-events: none;
      }
      .member {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        align-items: center;
        /* Only between the main line and the values line, so a row without
           disputed values keeps its height. */
        row-gap: 2px;
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
      .action,
      .offset:not(:empty),
      .target:not(:empty),
      .battery:not(:empty) {
        padding-left: 8px;
      }
      .name {
        min-width: 5em;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--primary-text-color);
      }
      /* The disputed values: a quieter second line from under the name to the
         row's end. It wraps between values, never inside one, and the
         separator hangs on the value before it, so a wrapped line never starts
         with a dot. Zero width with a full minimum keeps it out of the column
         sizing: the main line sets the menu's width, the values wrap in it. */
      .values {
        grid-row: 2;
        grid-column: 2 / -1;
        display: flex;
        flex-wrap: wrap;
        column-gap: 4px;
        width: 0;
        min-width: 100%;
        box-sizing: border-box;
        padding-left: 8px;
        font-size: 0.9em;
        white-space: normal;
        /* Above the details button, so each value's tooltip (the attribute's
           name) is reachable; a tap still opens the details (click handler). */
        position: relative;
        z-index: 1;
      }
      .navigable .values {
        cursor: pointer;
      }
      .value {
        white-space: nowrap;
      }
      /* The row's colour, not a deviating value's warning colour. */
      .value:not(:last-child)::after {
        content: ' ·';
        color: var(--secondary-text-color);
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
      /* Lying on its side like the panel's battery: MDI only has upright
         ones. Above the details button, so it keeps its tooltip. */
      .battery {
        display: inline-flex;
        position: relative;
        z-index: 1;
      }
      .battery svg {
        width: 14px;
        height: 14px;
        transform: rotate(90deg);
      }
      .battery .high {
        fill: var(--state-sensor-battery-high-color, var(--success-color, #43a047));
      }
      .battery .medium {
        fill: var(--state-sensor-battery-medium-color, var(--warning-color, #ff9800));
      }
      .battery .low {
        fill: var(--state-sensor-battery-low-color, var(--error-color, #db4437));
      }
      /* Misses the group's target. */
      .deviates {
        color: var(--warning-color, #ff9800);
      }
    `],F([m({attribute:!1})],B.prototype,"hass",2),F([m({attribute:!1})],B.prototype,"members",2),F([m({attribute:!1})],B.prototype,"isolated",2),F([m({attribute:!1})],B.prototype,"oob",2),F([m({attribute:!1})],B.prototype,"master",2),F([m({attribute:!1})],B.prototype,"batteries",2),F([m({attribute:!1})],B.prototype,"group",2),F([m({attribute:!1})],B.prototype,"divergenceSince",2),F([m({type:Boolean})],B.prototype,"navigable",2),B=F([L("cgh-member-list")],B);var Br=Object.defineProperty,Ir=Object.getOwnPropertyDescriptor,K=(e,t,o,s)=>{for(var i=s>1?void 0:s?Ir(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&Br(t,o,i),i};const Rr=10,hi={switch:{labelKey:"block.switch",icon:ws},window:{labelKey:"block.window",icon:ho},presence:{labelKey:"block.presence",icon:As}},jr=e=>e==="temperature"?"block.switch_temperature":e==="release"?"block.switch_release":"block.switch_off",mi={window:{labelKey:"feature.window",icon:ho},presence:{labelKey:"feature.presence",icon:As},schedule:{labelKey:"feature.schedule",icon:po},sync:{labelKey:"feature.sync",icon:fo},isolation:{labelKey:"feature.isolation",icon:mo},calibration:{labelKey:"feature.calibration",icon:$s}},Mt={ui:{labelKey:"source.manual",icon:Es},group:{labelKey:"source.manual",icon:Es},sync_mode:{labelKey:"source.sync",icon:fo},adopt_only:{labelKey:"source.mirror",icon:fo},window_control:{labelKey:"source.window",icon:ho},schedule:{labelKey:"source.schedule",icon:po}};let I=class extends Y(S){constructor(){super(...arguments),this.sections=["panel","badges","deviations"],this.battery=!0,this.navigable=!1,this.deviationsBadge=!0,this.quietWindow=!0,this._clock=new Ar(this),this._wake=new ii(this,()=>this._quietRemaining()),this._badgeFit=new xr(this,()=>{var e;return(e=this.renderRoot)==null?void 0:e.querySelector(".badges")}),this._membersOpen=!1,this._membersUp=!1,this._deviationsOpen=!1,this._deviationsUp=!1,this._onDocumentClick=e=>{const t=e.composedPath(),o=(...s)=>s.every(i=>{const a=this.renderRoot.querySelector(i);return!a||!t.includes(a)});this._membersOpen&&o(".members",".battery-toggle")&&(this._membersOpen=!1),this._deviationsOpen&&o(".dev-badge",".deviations-menu")&&(this._deviationsOpen=!1,this.requestUpdate())},this._onDocumentKeyDown=e=>{var i;if(e.key!=="Escape"||!(this._membersOpen||this._deviationsOpen))return;const t=this.renderRoot,o=t.activeElement,s=(a,n)=>{var r;o&&((r=t.querySelector(a))!=null&&r.contains(o))&&(n==null||n.focus())};this._membersOpen&&(s(".members-menu",(i=this._membersOpener)!=null&&i.isConnected?this._membersOpener:t.querySelector(".members-toggle")),this._membersOpen=!1),this._deviationsOpen&&(s(".deviations-menu",t.querySelector(".dev-badge")),this._deviationsOpen=!1,this.requestUpdate())}}willUpdate(e){super.willUpdate(e);const t=this.stateObj;if(!t||!this.quietWindow){this._divergence=void 0;return}const o=Mr(t.attributes),s=this._divergence;(s==null?void 0:s.entity)!==t.entity_id?this._divergence={entity:t.entity_id,diverged:o}:o!==s.diverged&&(this._divergence={entity:t.entity_id,diverged:o,since:o?Date.now():void 0})}_quietRemaining(){var e;return ni((e=this._divergence)==null?void 0:e.since)}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick),document.addEventListener("keydown",this._onDocumentKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick),document.removeEventListener("keydown",this._onDocumentKeyDown)}_closeMembers(){this._membersOpen=!1}_toggleMembers(e){var o;if(this._membersOpen){this._membersOpen=!1;return}this._membersOpener=e.currentTarget;const t=(o=this.renderRoot.querySelector(".members"))==null?void 0:o.getBoundingClientRect();if(t){const s=window.innerHeight-t.bottom;this._membersUp=t.top>=320||t.top>=s}this._deviationsOpen=!1,this._membersOpen=!0}_toggleDeviations(){var t;if(this._deviationsOpen){this._deviationsOpen=!1,this.requestUpdate();return}const e=(t=this.renderRoot.querySelector(".panel"))==null?void 0:t.getBoundingClientRect();if(e){const o=window.innerHeight-e.bottom;this._deviationsUp=e.top>=240||e.top>=o}this._membersOpen=!1,this._deviationsOpen=!0,this.requestUpdate()}_deviationGroups(e,t,o,s,i,a){const n=Object.keys(a),r=[];return e.length&&r.push({kind:"isolation",icon:mo,head:this.t("status.isolated",{count:e.length}),names:this._names(e)}),t.length&&r.push({kind:"oob",icon:Os,head:this.t("status.oob",{count:t.length}),names:this._names(t)}),o.length&&r.push({kind:"devices",icon:Ss,head:this.t(o.length===1?"status.device_unavailable":"status.devices_unavailable",{count:o.length}),names:this._names(o)}),s.length&&r.push({kind:"sensors",icon:Ss,head:this.t(s.length===1?"status.sensor_unavailable":"status.sensors_unavailable",{count:s.length}),names:this._names(s)}),i.length&&r.push({kind:"battery",icon:Nn,head:this.t("status.low_battery",{count:i.length}),names:this._names(i)}),n.length&&r.push({kind:"divergence",icon:jn,head:this.t(n.length===1?"status.setting_divergent":"status.settings_divergent",{count:n.length}),names:"",rows:n.map(l=>this._divergenceRow(l,a[l]))}),r}_divergenceRow(e,t){var n,r,l;const o=(n=this.stateObj)==null?void 0:n.attributes,s=new Map;for(const[u,p]of Object.entries(t)){const f=ri(this.hass,u,e,p),_=s.get(f)??{text:f,members:[]};_.members.push({name:this._name(u),deviates:Mo(o,u,e,p,(l=(r=this.hass)==null?void 0:r.states[u])==null?void 0:l.attributes)}),s.set(f,_)}const i=u=>u.members.some(p=>p.deviates),a=[...s.values()].sort((u,p)=>Number(i(u))-Number(i(p)));return{label:this._divergenceLabel(e),values:a}}_renderDeviation(e){return d`<div class="deviation ${e.kind}">
      <div class="dev-head">
        <svg viewBox="0 0 24 24"><path d=${e.icon} /></svg>
        <span>${e.head}</span>
      </div>
      ${e.rows?e.rows.map(t=>d`<div class="dev-row">
              <span class="dev-label">${t.label}</span>
              ${t.values.map((o,s)=>d`${s?" · ":""}<span class="dev-value"
                    >${o.text}:
                    ${o.members.map((i,a)=>d`${a?", ":""}<span class=${i.deviates?"deviates":""}
                            >${i.name}</span
                          >`)}</span
                  >`)}
            </div>`):d`<div class="dev-names">${e.names}</div>`}
    </div>`}_renderDeviationsBadge(e){const t=e.map(o=>o.head).join(" · ");return d`<button
      class="dev-badge"
      title=${t}
      aria-label=${t}
      aria-expanded=${this._deviationsOpen}
      @click=${this._toggleDeviations}
    >
      <svg viewBox="0 0 24 24"><path d=${Pn} /></svg>
    </button>`}_items(){var a;const e=(a=this.stateObj)==null?void 0:a.attributes;if(!e)return[];const t=[],o=e.blocking_reason;if(o!=null&&o.source&&hi[o.source]){const n=hi[o.source],r=o.since?Date.parse(o.since):NaN,l=Number.isNaN(r)?void 0:Math.floor((Date.now()-r)/6e4);t.push({kind:o.source,icon:n.icon,label:this.t(n.labelKey),action:o.source==="switch"?this.t(jr(e.main_switch_action)):void 0,detail:l==null?void 0:this.t("status.blocking_for",{duration:Ma(l,this.hass)})})}const s=_s(e.boost_until);s!=null&&t.push({kind:"boost",icon:Cs,label:this.t("boost.label"),detail:this._remaining(s)});const i=_s(e.schedule_hold_until);return i!=null&&t.push({kind:"hold",icon:Vn,label:this.t("feature.hold"),detail:this._remaining(i)}),e.active_schedule_slot_title&&t.push({kind:"schedule",icon:po,label:this._scheduleLabel(),...this._scheduleSource()}),t}_panel(e){var s;const t=Lr(e);if(t)return t;const o=(s=this.stateObj)==null?void 0:s.attributes.last_source;if(o&&Mt[o])return o==="schedule"?{kind:"source",icon:Mt[o].icon,label:this._scheduleLabel(),...this._scheduleSource()}:{kind:"source",icon:Mt[o].icon,label:this.t(Mt[o].labelKey),device:this._sourceDevice(o)}}_remaining(e){return this.t("status.remaining",{duration:za(e,this.hass)})}_sourceDevice(e){var i;if(e!=="sync_mode"&&e!=="adopt_only")return;const t=((i=this.stateObj)==null?void 0:i.attributes)??{},o=t.last_entity,s=t.member_entities??[];return o&&s.includes(o)?this._name(o):void 0}_scheduleLabel(){var e;return this.t(Cr((e=this.stateObj)==null?void 0:e.attributes.active_schedule_layer))}_scheduleSource(){var i;const e=((i=this.stateObj)==null?void 0:i.attributes)??{},t=e.active_schedule_layer==="bypass",o=t?e.active_schedule_bypass_entity:e.active_schedule_entity;if(!o)return{};const s=t?e.schedule_bypass_entity_overridden:e.schedule_entity_overridden;return{scheduleName:this._name(o),pill:s?this.t("status.via_service"):void 0}}_offset(){var s;const e=(s=this.stateObj)==null?void 0:s.attributes,t=e==null?void 0:e.group_offset;if(!(!t||((e==null?void 0:e.blocking_sources)??[]).length||e!=null&&e.boost_until))return this.t("status.offset",{value:ro(t,this.hass)})}_featureActive(e){var s;const t=((s=this.stateObj)==null?void 0:s.attributes)??{},o=t.blocking_sources??[];switch(e){case"window":return o.includes("window");case"presence":return o.includes("presence");case"schedule":return t.last_source==="schedule";case"sync":return t.last_source==="sync_mode"||t.last_source==="adopt_only";case"isolation":return(t.isolated_members??[]).length>0;default:return!1}}_featurePaused(e){var s;const t=((s=this.stateObj)==null?void 0:s.attributes)??{},o=t.config_overrides??{};switch(e){case"window":return o.window_mode==="disabled";case"presence":return o.presence_mode==="disabled";case"calibration":return o.calibration_mode==="disabled";case"sync":return t.effective_sync_mode==="disabled";case"isolation":return o.isolation_bypass==="all";default:return!1}}_scheduleInfo(){var n,r;const e=((n=this.stateObj)==null?void 0:n.attributes)??{},t=e.active_schedule_layer==="bypass"?e.active_schedule_bypass_entity:e.active_schedule_entity,o=t?(r=this.hass)==null?void 0:r.states[t]:void 0;if((o==null?void 0:o.state)!=="on"&&(o==null?void 0:o.state)!=="off")return;const s=o.state==="on",i=this._eventTime(o,s);if(s){const l=e.active_schedule_slot_title;return l?{text:this.t("status.slot",{title:l}),time:i&&this.t("status.until",{time:i})}:{text:i?this.t("status.active_until",{time:i}):this.t("status.active")}}const a=o.attributes.message;return a?{text:this.t("status.next_slot",{title:a}),time:i&&this.t("status.starts_at",{time:i})}:i?{text:this.t("status.next_at",{time:i})}:void 0}_eventTime(e,t){const o=e.attributes;if(e.entity_id.startsWith("calendar.")){const a=t?o.end_time:o.start_time,n=a?new Date(a.replace(" ","T")):void 0;if(!n||isNaN(n.getTime()))return;const r=o.all_day===!0;return r&&t&&n.setDate(n.getDate()-1),gs(n,this.hass,r)}const s=o.next_event,i=s?new Date(s):void 0;if(!(!i||isNaN(i.getTime())))return gs(i,this.hass)}_name(e){var t,o;return((o=(t=this.hass)==null?void 0:t.states[e])==null?void 0:o.attributes.friendly_name)??e}_batteryText(e){return Xs(e,this.hass,this.t("member.low_battery"))}_names(e){return e.map(t=>this._name(t)).join(", ")}_divergenceLabel(e){var o,s;if(e==="hvac_mode")return this.t("tile.mode");const t=this.stateObj;return t&&((s=(o=this.hass)==null?void 0:o.formatEntityAttributeName)==null?void 0:s.call(o,t,e))||e}_aside(e,t){return d` <span class="aside ${e}"
      >·&nbsp;<span class="text">${t}</span></span
    >`}render(){var Ht,Dt,at,De,nt;const e=(Ht=this.stateObj)==null?void 0:Ht.attributes;if(!e)return c;const t=this._items(),o=this._panel(t),s=this.sections.includes("panel"),i=this.sections.includes("badges"),a=this._badgeFit.fit.compact,n=this.sections.includes("deviations"),r=e.enabled_features??[],l=zr.filter(k=>r.includes(k)),u=e.isolated_members??[],p=e.oob_members??[],f=e.unavailable_sensors??[],_=this._quietRemaining()>0,g=Eo(e,_),x=e.member_entities??[],ie=this.battery?wr(x,this.hass):{},ae=Object.keys(ie),ze=this.battery?Qs(x,this.hass):{},X=this.battery?kr(x,this.hass):void 0,w=Hr(x,((Dt=this.hass)==null?void 0:Dt.states)??{}),v=this._deviationGroups(u,p,w,f,ae,g),$=v.length>0,b=s&&this.deviationsBadge&&$;b||(this._deviationsOpen=!1);const M=e.master_entity_id,E=ci(x,((at=this.hass)==null?void 0:at.states)??{},u,p,M,li(e,(De=this.hass)==null?void 0:De.states,_)),Te=E.slice(0,Rr),it=E.length-Te.length,Le=e.total_member_count??E.length,He=e.active_member_count??E.filter(k=>k.state!=="off"&&k.state!=="unavailable"&&k.state!=="unknown").length,z=this._scheduleInfo(),ne=this._offset();return d`
      <div class="status">
        ${s?d`<div class="panel ${(o==null?void 0:o.kind)??""}">
                ${ne||Le||b?d`<div class="panel-top">
                <div class="panel-left">
                ${X?d`<button
                      class="battery-toggle"
                      aria-expanded=${this._membersOpen}
                      @click=${this._toggleMembers}
                    >
                      <svg
                        class="battery ${ei(X.level)}"
                        viewBox="0 0 24 24"
                      >
                        <title
                          >${this._name(X.member)}: ${this._batteryText(X.state)}</title
                        >
                        <path d=${Ms(X.level)} />
                      </svg>
                    </button>`:c}
                ${ne?d`<span class="offset">${ne}</span>`:c}
                </div>
                ${b?this._renderDeviationsBadge(v):c}
                ${Le?d`<div class="members">
                        <button
                          class="members-toggle"
                          aria-expanded=${this._membersOpen}
                          @click=${this._toggleMembers}
                        >
                          <span class="dots">
                            ${Te.map(k=>d`<span
                                  class="dot ${ui(k)}"
                                  title=${this._name(k.id)}
                                ></span>`)}
                            ${it>0?d`<span class="more">+${it}</span>`:c}
                          </span>
                          <span class="count">${He}/${Le}</span>
                        </button>
                        ${this._membersOpen?d`<div
                                class="members-menu ${this._membersUp?"up":""}"
                                @hass-more-info=${this._closeMembers}
                              >
                                <cgh-member-list
                                  .hass=${this.hass}
                                  .members=${x}
                                  .isolated=${u}
                                  .oob=${p}
                                  .batteries=${ze}
                                  .master=${M}
                                  .group=${e}
                                  .divergenceSince=${(nt=this._divergence)==null?void 0:nt.since}
                                  .navigable=${this.navigable}
                                ></cgh-member-list>
                              </div>`:c}
                      </div>`:c}
                      </div>`:c}
                ${o?d`<div class="panel-main">
                        <svg viewBox="0 0 24 24"><path d=${o.icon} /></svg>
                        <span
                          >${o.label}${o.pill?d` <span class="pill"
                                  >${o.pill}</span
                                >`:c}${o.scheduleName?this._aside("schedule-name",o.scheduleName):c}${o.device?this._aside("device",o.device):c}${o.action?this._aside("action",o.action):c}${o.detail?this._aside("detail",o.detail):c}</span
                        >
                      </div>`:c}
                ${z?d`<div class="panel-info">
                        <span class="slot">${z.text}</span>
                        ${z.time?d`<span class="time">·&nbsp;${z.time}</span>`:c}
                      </div>`:c}
                ${b&&this._deviationsOpen?d`<div class="deviations-menu ${this._deviationsUp?"up":""}">
                        ${v.map(k=>this._renderDeviation(k))}
                      </div>`:c}
              </div>`:c}
        ${i&&(l.length||t.some(k=>k.kind==="boost"))?d`<div
                class="badges ${a?"compact":""}"
                style="column-gap: ${this._badgeFit.fit.gap}px"
              >
                ${l.map(k=>{const q=this._featureActive(k)?"on":this._featurePaused(k)?"paused":"",Z=this.t(mi[k].labelKey);return d`<div
                      class="badge feature ${k} ${q}"
                      title=${a?Z:c}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d=${mi[k].icon} />
                      </svg>
                      ${q==="paused"?d`<svg class="pause-mark" viewBox="0 0 24 24">
                            <title>${this.t("status.paused")}</title>
                            <path d=${Rn} />
                          </svg>`:c}
                      <span>${Z}</span>
                    </div>`})}
                ${t.filter(k=>k.kind==="boost"||k.kind==="hold").map(k=>{const q=this.t(k.kind==="boost"?"boost.label":"feature.hold");return d`<div
                      class="badge ${k.kind} on"
                      title=${a?q:c}
                    >
                      <svg viewBox="0 0 24 24"><path d=${k.icon} /></svg>
                      <span>${q}</span>
                    </div>`})}
              </div>`:c}
        ${n?d`<div class="deviations ${$?"":"empty"}">
                ${v.map(k=>this._renderDeviation(k))}
                ${$?c:d`<div class="deviation none">
                        ${this.t("status.no_deviations")}
                      </div>`}
              </div>`:c}
      </div>
    `}};I.styles=[Ds,C`
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
      /* Follows a rounder card like the tiles (--cgh-surface-radius), but
         only so far: a box this tall turns into a lozenge where a tile turns
         into a pill. */
      border-radius: min(var(--cgh-surface-radius, var(--ha-border-radius-md, 12px)), 12px);
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
    /* Battery and offset on the left, the deviations badge in the middle,
       the member strip on the right; any may be absent. Two equal side
       columns keep the badge centred in the panel, whatever stands beside
       it. The battery's height as a floor: the row keeps it when the battery
       is hidden or unknown, so the panel does not change height with it. */
    .panel-top {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
      min-width: 0;
      min-height: 16px;
    }
    .panel-left {
      grid-column: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    /* Opens the member list, where each member's battery is shown. */
    .battery-toggle {
      display: flex;
      flex: none;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
    }
    .battery-toggle:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 2px;
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
      /* Like every secondary text in the panel: the size of the asides. */
      font-size: calc(var(--ha-font-size-l, 1.05rem) * 0.95 * 0.75);
      color: var(--secondary-text-color);
    }
    .members {
      grid-column: 3;
      justify-self: end;
      position: relative;
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
      font-size: calc(var(--ha-font-size-l, 1.05rem) * 0.95 * 0.75);
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
    }
    /* Both menus float over the card in exactly its colour, lifted by their
       edge and depth: a clear edge with a brighter rim at the top, a wide soft
       shadow plus a close dense one. A surface of their own read as part of
       the panel (darker) or washed out (lighter), and so did a sheen, which
       lightens the whole surface. Opaque on purpose: the panel's
       backdrop-filter would keep a glass menu from blurring what lies behind
       it. */
    .members-menu,
    .deviations-menu {
      border: 1px solid color-mix(in srgb, var(--primary-text-color) 20%, transparent);
      border-radius: var(--ha-border-radius-md, 12px);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-shadow:
        0 16px 40px rgb(0 0 0 / 0.55),
        0 4px 12px rgb(0 0 0 / 0.4),
        inset 0 1px 0 color-mix(in srgb, var(--primary-text-color) 14%, transparent);
    }
    .members-menu.up {
      top: auto;
      bottom: calc(100% + 6px);
    }
    /* No taller than the battery, so the row keeps its height when it comes
       and goes. A wider invisible ring makes it easy to tap. */
    .dev-badge {
      grid-column: 2;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--warning-color, #ff9800);
      cursor: pointer;
    }
    .dev-badge::before {
      content: '';
      position: absolute;
      inset: -8px;
    }
    /* A ring for the keyboard only, round like the icon — not the browser's
       square one after every tap. */
    .dev-badge:focus {
      outline: none;
    }
    .dev-badge:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 50%;
    }
    .dev-badge svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      filter: drop-shadow(0 0 3px color-mix(in srgb, currentColor 50%, transparent));
    }
    /* The deviations as a menu over the card, anchored to the whole panel:
       the card keeps its height. Taller than the member menu — a long
       divergence list is the usual content. */
    .deviations-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: min(480px, 70vh);
      overflow-y: auto;
      padding: 8px 10px;
      font-size: var(--ha-font-size-s, 0.75rem);
      font-weight: var(--ha-font-weight-normal, 400);
      color: var(--secondary-text-color);
    }
    .deviations-menu.up {
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
    /* Qualifiers of the label — the schedule's name, the switch's action, the
       duration — not a second headline: the label alone stays large, so a
       blocker fits one line. Only the text is set small; the dot keeps
       nearly the label's size and stays bound to the text by a no-break
       space. A duration never splits between number and unit; a name wraps. */
    .panel-main .aside {
      color: var(--secondary-text-color);
      font-size: 0.95em;
      font-weight: var(--ha-font-weight-normal, 400);
    }
    .panel-main .detail,
    .panel-main .action {
      white-space: nowrap;
    }
    /* Pill, dot and text are centred on the middle of the label's capitals.
       The dot sits there by itself; the smaller text is raised by half the
       difference of the cap heights (the label is 1 / 0.95 / 0.75 times its
       size), so the two cap middles meet. */
    .panel-main .aside .text {
      font-size: 0.75em;
      vertical-align: calc(1cap * (1 / 0.95 / 0.75 - 1) / 2);
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
      /* Centred on the label's capitals: middle puts it on half the x-height,
         the shift lifts it by half the gap to the cap height (Roboto: cap
         height 0.711em, x-height 0.528em of the label). */
      vertical-align: middle;
      position: relative;
      top: calc(var(--ha-font-size-l, 1.05rem) * -0.0915);
    }
    .panel-main svg {
      flex: none;
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    /* The size of the label's asides (0.95 × 0.75 of the label): secondary
       information in the same grey, one level, not a third size. */
    .panel-info {
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 0;
      font-size: calc(var(--ha-font-size-l, 1.05rem) * 0.95 * 0.75);
      color: var(--secondary-text-color);
    }
    /* A long title gives way; the time beside it stays whole. */
    .panel-info .slot {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .panel-info .time {
      flex: none;
      white-space: nowrap;
    }
    .panel.source .panel-main {
      font-weight: var(--ha-font-weight-normal, 400);
    }
    /* The column gap comes from the fit measurement; wrapping is only the
       last resort for a row that does not fit even as icons. Stretched, not
       centred like its siblings: the measurement reads the room from the
       row's own width, which would otherwise shrink to its icons. */
    .badges {
      align-self: stretch;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 16px;
    }
    .badge {
      position: relative;
      flex: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-xs, 0.7rem);
    }
    .badge > span {
      white-space: nowrap;
    }
    /* Icons only: the label keeps its line, so the row keeps its height and
       the icons do not move, but takes no width. Clipped, not hidden: a
       screen reader still reads the name. */
    .badges.compact .badge > span {
      width: 0;
      overflow: hidden;
    }
    /* 22px: the fit measurement counts a badge at least this wide
       (BADGE_ICON). */
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
    /* Active badges glow in their own colour (icon via drop-shadow), at half
       strength: a full-colour halo turns neon in bright theme colours. */
    .badge.on svg {
      filter: drop-shadow(0 0 3px color-mix(in srgb, currentColor 50%, transparent));
    }
    /* Paused by a slot or preset: the plain badge's colour, only quieter —
       --disabled-color is a dark grey in HA's dark mode and vanished. The
       dimming alone was too subtle, so a pause mark carries the state. */
    .badge.paused {
      opacity: 0.45;
    }
    /* Two bars in the badge's own grey on the icon's upper right, out of the
       column so the badge keeps its size. */
    .badge svg.pause-mark {
      position: absolute;
      top: -3px;
      left: calc(50% + 6px);
      width: 12px;
      height: 12px;
    }
    /* A transparent ring around the mark: the icon is cut away under it, so
       the bars never touch the icon whatever lies behind the card. The
       centre is the mark's, in the 22px icon's own coordinates (icon left at
       50% - 11px, mark centre at 50% + 12px and 3px down). */
    .badge.paused > svg:not(.pause-mark) {
      -webkit-mask-image: radial-gradient(circle at 23px 3px, transparent 5.5px, #000 6.5px);
      mask-image: radial-gradient(circle at 23px 3px, transparent 5.5px, #000 6.5px);
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
      /* Capped like the panel. */
      border-radius: min(var(--cgh-surface-radius, var(--ha-border-radius-md, 12px)), 12px);
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
    /* Flat like every icon in this box; the glow is the OOB dot's. */
    .deviation.oob,
    .deviation.devices,
    .deviation.sensors {
      color: var(--warning-color, #ff9800);
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
    /* One disputed setting per row; a wrapped line hangs under the values, so
       the label stays the row's left edge. */
    .dev-row {
      padding-left: 1em;
      text-indent: -1em;
      overflow-wrap: anywhere;
    }
    .dev-label {
      color: var(--primary-text-color);
      font-weight: var(--ha-font-weight-medium, 500);
      margin-right: 4px;
    }
    .dev-row .deviates {
      color: var(--warning-color, #ff9800);
    }
    `],K([m({attribute:!1})],I.prototype,"hass",2),K([m({attribute:!1})],I.prototype,"stateObj",2),K([m({attribute:!1})],I.prototype,"sections",2),K([m({attribute:!1})],I.prototype,"battery",2),K([m({attribute:!1})],I.prototype,"navigable",2),K([m({attribute:!1})],I.prototype,"deviationsBadge",2),K([m({attribute:!1})],I.prototype,"quietWindow",2),K([D()],I.prototype,"_membersOpen",2),K([D()],I.prototype,"_membersUp",2),I=K([L("cgh-status")],I);const Xe=1,pi=["offset","temperature","humidity"],fi=e=>{Array.isArray(e.controls)&&(e.controls=e.controls.filter(t=>t!=="toggle"))},Nr={0:e=>{const t={...e};if(t.views!==void 0){t.views===null&&(t.views=!1),fi(t);for(const r of pi)delete t[r];return{...t,config_version:1}}t.main_switch===!0?delete t.main_switch:t.main_switch=!1,t.history=!1,t.settings=!1;const o=t.boost;(typeof o!="object"||o===null||Array.isArray(o))&&(t.boost=!1);const s=t.reset;(!Array.isArray(s)||s.length===0)&&(t.reset=!1);const i=t.controls,n=!Array.isArray(i)||i.includes("toggle")?[...t.offset===!0?["offset"]:[],...t.temperature!==!1?["temperature"]:[],...t.humidity!==!1?["humidity"]:[]]:[];n.length===0?t.views=!1:n.length<3&&(t.views=[...n]),fi(t);for(const r of pi)delete t[r];return{...t,config_version:1}}},bi=e=>{const t=e.config_version,o=typeof t=="number"&&Number.isInteger(t)&&t>=0?t:0;if(o>Xe)return console.warn(`[climate-group-helper-card] config_version ${o} is newer than this card (${Xe}); update the integration`),e;let s=e;for(let i=o;i<Xe;i++)s=Nr[i](s);return s},zo="climate.demo",gi="schedule.demo_schedule",_i="calendar.demo_calendar",To="calendar.demo_vacation",Lo="switch.demo_main_switch",Ho="number.demo_group_offset",zt="binary_sensor.demo_window",Qe="person.demo_resident",vi=3500,P=[{id:"climate.demo_living_room",nameKey:"demo.room.living_room"},{id:"climate.demo_bedroom",nameKey:"demo.room.bedroom",battery:"sensor.demo_bedroom_battery"},{id:"climate.demo_bathroom",nameKey:"demo.room.bathroom",battery:"sensor.demo_bathroom_battery"},{id:"climate.demo_kitchen",nameKey:"demo.room.kitchen",battery:"binary_sensor.demo_kitchen_battery_low"}],Ur=Object.fromEntries(P.flatMap(e=>{const t=`demo_device_${e.id}`;return(e.battery?[e.id,e.battery]:[e.id]).map(s=>[s,{entity_id:s,device_id:t}])})),Fr=P[0].id,Kr=1,Gr=2,Wr=4,qr=8,Zr=16,Yr=32,Jr=512,yi=["heat","cool","heat_cool","auto","dry","fan_only","off"],Xr=yi.filter(e=>e!=="off"),Do=["none","eco","comfort","away"],Vo=["auto","low","medium","high"],et=["off","on","vertical","horizontal","both"],Po=["off","on"],wi=["window","presence","schedule","sync","isolation","range_template","calibration","master"],Qr=12,el=15,tl=16,ol=2,tt=e=>Math.round(e*10)/10,Tt=e=>Math.round(e*2)/2,sl=e=>e.length?e.reduce((t,o)=>t+o,0)/e.length:void 0,G=(e,t,o)=>({entity_id:e,state:t,attributes:o}),il=e=>{let t=e+1831565813|0;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296},ki=(e,t,o,s,i)=>{switch(e){case"off":return"off";case"dry":return"drying";case"fan_only":return"fan";case"heat":return o!=null&&t<o?"heating":"idle";case"cool":return o!=null&&t>o?"cooling":"idle";default:{const a=s??(o!=null?o-.5:void 0),n=i??(o!=null?o+.5:void 0);return a!=null&&t<a?"heating":n!=null&&t>n?"cooling":"idle"}}},al=(e,t={})=>{const o={};if(e.length<2)return o;const s=Object.fromEntries(e.map(i=>[i.entity_id,i.state]));new Set(Object.values(s)).size>1&&(o.hvac_mode=s);for(const i of["temperature","target_temp_low","target_temp_high"]){const a=e.filter(r=>r.attributes[i]!=null),n=a.map(r=>r.attributes[i]-(t[r.entity_id]??0));new Set(n).size>1&&(o[i]=Object.fromEntries(a.map(r=>[r.entity_id,r.attributes[i]])))}for(const i of["fan_mode","preset_mode","swing_mode","swing_horizontal_mode","humidity"]){const a=Object.fromEntries(e.filter(n=>n.attributes[i]!=null).map(n=>[n.entity_id,n.attributes[i]]));new Set(Object.values(a)).size>1&&(o[i]=a)}return o},nl=(e=Date.now(),t)=>{const o=h=>io(t,h),s=Math.floor(e/vi),i=h=>il(Math.imul(s,2654435761)+h),a=(h,y)=>i(y)<h,n=(h,y)=>h[Math.floor(i(y)*h.length)];let r=a(.6,2),l=a(.6,14),u=a(.8,16),p=a(.7,15),f=a(.55,17),_=a(.5,18),g=wi.filter((h,y)=>a(.55,100+y));const x=h=>g.includes(h),ie=g.length>0,ae=[["full",2],["normal",5],["off",1],["boost",2],["hold",x("schedule")?2:0],["window_off",x("window")?1:0],["window_temperature",x("window")?1:0],["presence_off",x("presence")?1:0],["presence_offset",x("presence")?1:0],["presence_temperature",x("presence")?1:0],["presence_preset",x("presence")&&u?1:0],["switch_off",ie?1:0],["switch_temperature",ie?1:0],["switch_release",ie?1:0]],ze=ae.reduce((h,[,y])=>h+y,0);let X=i(1)*ze;const w=(ae.find(([,h])=>(X-=h)<0)??ae[0])[0],v=w==="full";v&&(g=[...wi],r=!0,l=!0,u=!0,p=!0,f=!0,_=!0);const $=h=>g.includes(h),b=g.length>0,M=w==="normal"||w==="hold"||v,E=[];w.startsWith("switch")&&E.push("switch"),w.startsWith("window")&&E.push("window"),w.startsWith("presence")&&E.push("presence"),w.startsWith("switch")&&$("window")&&a(.35,131)&&E.push("window"),(w.startsWith("switch")||w.startsWith("window"))&&$("presence")&&a(.35,132)&&E.push("presence");const Te=["switch","window","presence"].find(h=>E.includes(h)),it={[zt]:"window",[Qe]:"presence"},Le=Object.keys(it).filter(h=>$(it[h])&&!(h===Qe&&E.includes("presence"))),He=Le.length&&a(.3,160)?[n(Le,161)]:[],z={};v?z.calibration_mode="disabled":($("window")&&!E.includes("window")&&a(.25,140)&&(z.window_mode="disabled"),$("presence")&&!E.includes("presence")&&a(.25,141)&&(z.presence_mode="disabled"),$("calibration")&&a(.25,142)&&(z.calibration_mode="disabled"),$("isolation")&&a(.25,143)&&(z.isolation_bypass="all"),$("sync")&&a(.25,144)&&(z.sync_mode="disabled"));const ne=$("sync")?z.sync_mode==="disabled"?"disabled":n(v?["mirror","mirror_lock","master_lock","adopt_only"]:["lock","mirror","mirror_lock","master_lock","adopt_only"],145):"disabled",Ht=ne==="disabled"||ne==="lock"?[]:[ne==="adopt_only"?"adopt_only":"sync_mode"],Dt=w==="switch_temperature"||w==="window_temperature"||w==="presence_offset"||w==="presence_temperature"||w==="presence_preset",at=w==="boost"&&a(.3,3),De=w==="boost"&&!at&&a(.25,95),nt=n(De?[17,18,19]:[24,25,26,28],96),k=w==="hold"||w==="boost"&&$("schedule")&&a(.35,97),q=w==="off"||at?"off":De?"cool":Dt||w==="boost"?"heat":n(v?["heat","cool","heat_cool"]:Xr,4),Z=q==="heat_cool"&&r,ge=Tt(18+i(5)*6),Vt=Z?ge-1.5:void 0,Pt=Z?ge+1.5:void 0,Oi=u?n(v?["eco","comfort"]:["none","none","eco","comfort"],6):void 0,Bt=b&&u?o("demo.vacation"):void 0,$l=Bt?[...Do,Bt]:Do,Io=!v&&w!=="presence_preset"&&Bt&&a(.2,65)?Bt:void 0,It=p?n(v?["low","medium","high"]:Vo,11):void 0,Rt=f?n(v?et.filter(h=>h!=="off"):et,12):void 0,jt=_?v?"on":n(Po,13):void 0,_e=l?40+Math.round(i(9)*25):void 0;let ve=q,ye=Z?void 0:ge,Nt=Oi;switch(w){case"switch_off":case"window_off":case"presence_off":ve="off";break;case"switch_temperature":ye=el;break;case"boost":ve=De?"cool":"heat",ye=nt;break;case"window_temperature":ye=Qr;break;case"presence_offset":ye=ge-ol;break;case"presence_temperature":ye=tl;break;case"presence_preset":Nt="away";break}(w==="switch_off"||Te==="window"&&w==="window_off")&&(ve="off");const Ei=tt(v?q==="cool"?(Pt??ge)+1.5+i(7):(Vt??ge)-1.5-i(7):19+i(7)*5),rt=!v&&a(.2,20)?Math.floor(i(21)*P.length):-1,xl=[0,1,2,3].filter(h=>h!==rt),lt=v?1:$("isolation")&&!z.isolation_bypass&&a(.5,22)?n(xl,23):-1,Ro=[0,1,2,3].filter(h=>h!==rt&&h!==lt),Al=M&&ve!=="off",jo=(M||w==="switch_release")&&ve!=="off",ct=v?3:Al&&a(.3,24)?n(Ro,25):-1,Mi=!v&&jo&&a(.3,26)?n(Ro.filter(h=>h!==ct),27):-1,dt=Ro.filter(h=>h!==ct&&h!==Mi),Cl=v?2:jo&&dt.length&&a(.55,28)?n(dt,29):-1,Sl=a(.5,30)?.5:-.5,ut=(h,y,T)=>!T||!dt.length?-1:v||jo&&a(y,h-1)?n(dt,h):-1,Ol=ut(32,.45,u&&!Io),El=n(Do.filter(h=>h!==Nt&&h!=="away"),33),Ml=ut(35,.45,p),zl=n(Vo.filter(h=>h!==It),36),Tl=ut(162,.4,f),Ll=n(et.filter(h=>h!==Rt),163),Hl=ut(165,.35,_),Dl=jt==="on"?"off":"on",Vl=ut(167,.35,l),Pl=_e!=null?_e>=60?_e-5:_e+5:void 0,No=b&&M&&(v||a(.45,82))?n([.5,1,1.5,-.5,-1],84):0,we={};if(b&&(v||a(.5,85))){const h=P.filter((T,Q)=>Q!==rt),y=v?P[2]:n(h,86);if(we[y.id]=n([.5,1,1.5,-.5,-1],87),a(v?.5:.3,88)){const T=n(h.filter(Q=>Q.id!==y.id),89);T&&(we[T.id]=n([.5,-.5,1],90))}}const Ut={},Ft=[];P.forEach((h,y)=>{const T=o(h.nameKey);if(y===rt){Ut[h.id]=G(h.id,"unavailable",{friendly_name:T});return}const Q=tt(Ei+(i(40+y)-.5)),Fi=y===lt||y===ct||y===Mi?"off":ve,Ki=No+(we[h.id]??0),Gi=(y===Cl?Sl:0)+Ki,Wi=ye!=null?ye+Gi:void 0,qi=Vt!=null?Vt+Gi:void 0,Zi=Pt!=null?Pt+Ki:void 0,Yi=G(h.id,Fi,{friendly_name:T,current_temperature:Q,temperature:Wi,target_temp_low:qi,target_temp_high:Zi,preset_mode:y===Ol?El:Nt,fan_mode:y===Ml?zl:It,swing_mode:y===Tl?Ll:Rt,swing_horizontal_mode:y===Hl?Dl:jt,humidity:y===Vl?Pl:_e,hvac_action:ki(Fi,Q,Wi,qi,Zi)});Ut[h.id]=Yi,y!==lt&&Ft.push(Yi)});const zi=Ft.filter(h=>h.state!=="off").length?ve:"off",ht=(h,y=!0,T=tt)=>{const Q=sl(Ft.filter(pt=>pt.attributes[h]!=null).map(pt=>pt.attributes[h]-(y?we[pt.entity_id]??0:0)));return Q!=null?T(Q):void 0},Ti=ht("current_temperature",!1)??Ei,Li=Z?void 0:ht("temperature",!0,Tt),Hi=Z?ht("target_temp_low",!0,Tt):void 0,Di=Z?ht("target_temp_high",!0,Tt):void 0,Vi=l?ht("humidity",!1):void 0,Bl=l?Vi!=null?Math.round(Vi):_e:void 0,Pi=al(Ft,we),Il=Object.values(Ut).filter(h=>h.state!=="off"&&h.state!=="unavailable").length,Uo=v?!1:a(.5,50),Bi=Uo?_i:gi,mt=$("schedule")&&(v||k||a(.6,51)),ke=!v&&$("schedule")&&!k&&a(.25,52),Ii=$("schedule")&&a(.5,53),Kt=$("schedule")?ke?"bypass":mt?"main":Ii?"fallback":"none":void 0,Ri=["ui","group",...Ht],Fo=v?"schedule":k?n(Ri,60):Kt&&Kt!=="none"&&a(.6,61)?"schedule":n(Ri,62),Rl=new Date(e-Math.round(1+i(70)*20)*6e4),jl=G(zo,zi,{friendly_name:o("demo.group"),min_temp:5,max_temp:35,target_temp_step:.5,current_temperature:Ti,temperature:Li,target_temp_low:Hi,target_temp_high:Di,current_humidity:35+Math.round(i(8)*30),humidity:Bl??40+Math.round(i(9)*25),min_humidity:0,max_humidity:100,target_humidity_step:1,hvac_action:ki(zi,Ti,Li,Hi,Di),hvac_modes:yi,preset_modes:$l,preset_mode:Io??Nt,active_virtual_preset:Io,fan_modes:Vo,fan_mode:It,swing_modes:et,swing_mode:Rt??n(et,12),swing_horizontal_modes:Po,swing_horizontal_mode:jt??n(Po,13),supported_features:Kr|(r?Gr:0)|(l?Wr:0)|(p?qr:0)|(u?Zr:0)|(f?Yr:0)|(_?Jr:0),active_member_count:Il,total_member_count:P.length,member_entities:P.map(h=>h.id),enabled_features:g,blocking_sources:E,blocking_reason:Te?{source:Te,since:Rl.toISOString()}:void 0,isolated_members:lt>=0?[P[lt].id]:[],oob_members:ct>=0?[P[ct].id]:[],member_divergence:Pi,config_overrides:Object.keys(z).length?z:void 0,effective_sync_mode:b?ne:void 0,main_switch_entity_id:b?Lo:void 0,offset_entity_id:b?Ho:void 0,main_switch_action:b?w==="switch_temperature"?"temperature":w==="switch_release"?"release":"off":void 0,assumed_state:Object.keys(Pi).length>0,last_source:Fo,last_entity:Fo==="sync_mode"||Fo==="adopt_only"?n(P,63).id:void 0,last_changed:new Date(e-(1+Math.round(i(64)*9))*6e4).toISOString(),active_schedule_entity:$("schedule")?Bi:void 0,schedule_entity_overridden:$("schedule")&&(v||a(.6,54))?!0:void 0,active_schedule_bypass_entity:$("schedule")?To:void 0,schedule_bypass_entity_overridden:ke&&a(.5,55)?!0:void 0,active_schedule_layer:Kt,active_schedule_slot_title:ke?o("demo.vacation"):mt&&Uo?o("demo.slot"):void 0,schedule_fallback_payload:Ii?{temperature:17}:void 0,schedule_fallback_payload_active:Kt==="fallback"?!0:void 0,boost_temperature:w==="boost"?nt:void 0,boost_until:w==="boost"?new Date(e+(1+i(80)*15)*6e4).toISOString():void 0,schedule_hold_until:k?new Date(e+(5+i(81)*55)*6e4).toISOString():void 0,group_offset:No,target_state:{hvac_mode:q,temperature:Z?void 0:ge,target_temp_low:Vt,target_temp_high:Pt,preset_mode:Oi,fan_mode:It,swing_mode:Rt,swing_horizontal_mode:jt,humidity:_e},member_offsets:Object.keys(we).length?we:void 0,master_entity_id:$("master")?Fr:void 0,master_fallback_active:$("master")&&rt===0,unavailable_sensors:He.length?He:void 0}),ji=new Date(e+(1+i(90)*90)*6e4),Ni=h=>{const y=T=>String(T).padStart(2,"0");return`${h.getFullYear()}-${y(h.getMonth()+1)}-${y(h.getDate())} ${y(h.getHours())}:${y(h.getMinutes())}:00`},Nl=Uo?G(_i,mt?"on":"off",{friendly_name:o("demo.schedule"),message:o("demo.slot"),all_day:!1,[mt?"end_time":"start_time"]:Ni(ji)}):G(gi,mt?"on":"off",{friendly_name:o("demo.schedule"),next_event:ji.toISOString()}),Gt=new Date(e);Gt.setHours(0,0,0,0),Gt.setDate(Gt.getDate()+2+Math.floor(i(91)*10));const Ul=G(To,ke?"on":"off",{friendly_name:o("demo.vacation"),message:ke?o("demo.vacation"):void 0,all_day:ke?!0:void 0,end_time:ke?Ni(Gt):void 0}),Fl=P.filter(h=>h.battery),Kl=v||a(.35,150)?n(Fl,151).id:void 0,Ui={};P.forEach((h,y)=>{if(!h.battery)return;const T=h.id===Kl;Ui[h.battery]=h.battery.startsWith("binary_sensor.")?G(h.battery,T?"on":"off",{device_class:"battery"}):G(h.battery,String(T?5+Math.round(i(152)*(Oo-10)):40+Math.round(i(153+y)*60)),{device_class:"battery",unit_of_measurement:"%"})});const Gl={[zt]:G(zt,He.includes(zt)?"unavailable":E.includes("window")?"on":"off",{friendly_name:o("demo.window_sensor"),device_class:"window"}),[Qe]:G(Qe,He.includes(Qe)?"unavailable":E.includes("presence")?"not_home":"home",{friendly_name:o("demo.presence_sensor")})},Wl={entity_id:Lo,state:E.includes("switch")?"off":"on",attributes:{}},ql={entity_id:Ho,state:String(No),attributes:{min:-5,max:5,step:.5}};return{[zo]:jl,...b?{[Lo]:Wl,[Ho]:ql}:{},[Bi]:Nl,...$("schedule")?{[To]:Ul}:{},...Ut,...Ui,...Gl}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const rl=e=>e.strings===void 0,ll={},cl=(e,t=ll)=>e._$AH=t;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const W=ms(class extends ps{constructor(e){if(super(e),e.type!==ue.PROPERTY&&e.type!==ue.ATTRIBUTE&&e.type!==ue.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!rl(e))throw Error("`live` bindings can only contain a single expression")}render(e){return e}update(e,[t]){if(t===j||t===c)return t;const o=e.element,s=e.name;if(e.type===ue.PROPERTY){if(t===o[s])return j}else if(e.type===ue.BOOLEAN_ATTRIBUTE){if(!!t===o.hasAttribute(s))return j}else if(e.type===ue.ATTRIBUTE&&o.getAttribute(s)===t+"")return j;return cl(e),t}});async function dl(){var e,t,o,s;if(!customElements.get("ha-entity-picker"))try{const i=window.loadCardHelpers;if(i){const a=await i(),n=await((e=a==null?void 0:a.createCardElement)==null?void 0:e.call(a,{type:"entities",entities:[]}));if(await((t=n==null?void 0:n.getConfigElement)==null?void 0:t.call(n)),!customElements.get("ha-entity-picker")&&(a!=null&&a.createRowElement)){const r=await a.createRowElement({type:"attribute"});await((o=r==null?void 0:r.getConfigElement)==null?void 0:o.call(r))}}if(!customElements.get("ha-entity-picker")){const a=customElements.get("hui-glance-card");await((s=a==null?void 0:a.getConfigElement)==null?void 0:s.call(a))}}catch(i){console.warn("[climate-group-helper-card] Failed to preload HA form components:",i)}}var ul=Object.defineProperty,hl=Object.getOwnPropertyDescriptor,ot=(e,t,o,s)=>{for(var i=s>1?void 0:s?hl(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&ul(t,o,i),i};const ml={panel:"editor.section.panel",badges:"editor.section.badges",deviations:"editor.section.deviations"},$i={slider:"editor.control.slider",buttons:"editor.control.buttons"},pl={title:"editor.name",slider:"editor.control.slider",views:"editor.control.toggle",features:"editor.features",boost:"editor.boost",reset:"editor.reset",panel:"editor.section.panel"},xi=St.filter(e=>e!=="slider"),fl={offset:"editor.offset",temperature:"common.temperature",humidity:"common.humidity"},bl=["title","more_info","history","settings","battery","deviations_badge","main_switch"],Ai={status:Ct,features:We,views:Ge,reset:Bs},Ci=(e,t)=>e.every(o=>t.includes(o))&&t.every(o=>e.includes(o)),gl={mode:"tile.mode",preset:"tile.preset",fan:"tile.fan",swing:"tile.swing",swing_horizontal:"tile.swing_horizontal"};let R=class extends Y(S){constructor(){super(...arguments),this._open={title:!1,slider:!1,views:!1,features:!1,boost:!1,reset:!1,panel:!1}}setConfig(e){this._config=bi(e)}connectedCallback(){super.connectedCallback(),dl().then(()=>this.requestUpdate())}_emit(e){if(!this._config)return;const t={...this._config,...e};t.name===""&&delete t.name;for(const o of bl)t[o]!==!1&&delete t[o];for(const o of Object.keys(Ai)){const s=t[o];Array.isArray(s)&&(s.length?Ci(s,Ai[o])&&delete t[o]:t[o]=!1)}Array.isArray(t.controls)&&Ci(t.controls,St)&&delete t.controls;for(const o of Object.keys(t))t[o]===void 0&&delete t[o];this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}_entityChanged(e){this._emit({entity:e.detail.value})}_titleChanged(e){this._emit({title:e.target.checked})}_cornerChanged(e,t){this._emit({[e]:this._checked(t)})}_moreInfoChanged(e){this._emit({more_info:e.target.checked})}_nameChanged(e){this._emit({name:e.target.value})}_demoChanged(e){var o;const t=e.target.checked;if(!t&&!((o=this._config)!=null&&o.entity)){this.requestUpdate();return}this._emit({demo:t})}static _toggled(e,t,o,s){return e.filter(i=>i===o?s:t.includes(i))}_checked(e){return e.target.checked}_sectionChanged(e,t){const o=_o(this._config)??[];this._emit({status:R._toggled(Ct,o,e,this._checked(t))})}_batteryChanged(e){this._emit({battery:this._checked(e)})}_deviationsBadgeChanged(e){this._emit({deviations_badge:this._checked(e)})}_controlChanged(e,t){const o=$o(this._config);this._emit({controls:R._toggled(St,o,e,this._checked(t))})}_viewsChanged(e){this._emit({views:this._checked(e)?void 0:!1})}_viewChanged(e,t){this._emit({views:R._toggled(Ge,yo(this._config),e,this._checked(t))})}_mainSwitchChanged(e){this._emit({main_switch:this._checked(e)})}_featuresChanged(e){this._emit({features:this._checked(e)?void 0:!1})}get _unit(){var e,t,o;return((o=(t=(e=this.hass)==null?void 0:e.config)==null?void 0:t.unit_system)==null?void 0:o.temperature)??"°C"}get _boostRaw(){return So(this._config)?qs(this._config,this._unit):{}}get _boostAbsolute(){const e=this._boostRaw;return e.temperature!==void 0&&e.temperature_offset===void 0}get _boostDuration(){const e=this._boostRaw.duration;return typeof e=="number"&&Number.isInteger(e)&&e>=1?e:Ks}_boostChanged(e){this._emit({boost:this._checked(e)?void 0:!1})}_boostKindChanged(e){const t=this._boostDuration;this._emit({boost:e?{temperature:Gs(this._unit),duration:t}:{temperature_offset:Co(this._unit).temperature_offset,duration:t}})}_number(e){const t=e.target,o=t.value.trim()===""?NaN:Number(t.value);if(Number.isFinite(o))return o;this.requestUpdate()}get _boostLimit(){const e=Ws(this._unit);return this._boostAbsolute?e.temperature:e.temperature_offset}_boostValueChanged(e){const t=this._number(e);if(t===void 0)return;const[o,s]=this._boostLimit,i=Math.min(s,Math.max(o,t)),a=this._boostDuration,n=this._boostAbsolute?{temperature:i,duration:a}:{temperature_offset:i,duration:a};this._emit({boost:n}),this.requestUpdate()}_boostDurationChanged(e){const t=this._number(e);if(t===void 0)return;const o=Math.min(xo,Math.max(1,Math.round(t))),s=this._boostRaw,i=this._boostAbsolute?{temperature:typeof s.temperature=="number"&&Number.isFinite(s.temperature)?s.temperature:Gs(this._unit),duration:o}:{temperature_offset:typeof s.temperature_offset=="number"&&Number.isFinite(s.temperature_offset)?s.temperature_offset:Co(this._unit).temperature_offset,duration:o};this._emit({boost:i}),this.requestUpdate()}_resetChanged(e){this._emit({reset:this._checked(e)?void 0:!1})}_resetFieldChanged(e,t){this._emit({reset:R._toggled(Ot,Et(this._config),e,this._checked(t))})}_tileChanged(e,t){this._emit({features:R._toggled(We,vo(this._config),e,this._checked(t))})}_toggleOpen(e){this._open={...this._open,[e]:!this._open[e]}}_row(e,t){const o=t?this._open[t]:!1;return d`<div class="row">
      ${t?d`<button
              type="button"
              class="chevron ${t} ${o?"open":""}"
              aria-expanded=${o?"true":"false"}
              aria-label=${this.t(pl[t])}
              @click=${()=>this._toggleOpen(t)}
            >
              <svg viewBox="0 0 24 24"><path d=${Mn} /></svg>
            </button>`:d`<span class="gutter"></span>`}
      ${e}
    </div>`}render(){if(!this._config)return c;const e=Is(this._config),t=_o(this._config),o=vo(this._config),s=$o(this._config),i=s.includes("slider"),a=Fs(this._config),n=yo(this._config),r=n.length>0,l=o.length>0,u=(t==null?void 0:t.includes("panel"))??!1,p=nr(this._config),f=Et(this._config),_=So(this._config),g=this._boostAbsolute,x=this._boostRaw,ie=g?x.temperature:x.temperature_offset,ae=x.duration,ze=r&&n.length<Ge.length,X=i&&(xi.some(b=>!s.includes(b))||!r||ze),w=l&&o.length<We.length,v=p&&f.length<Ot.length,$=u&&!(wo(this._config)&&ko(this._config));return d`
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
            .checked=${W(this._config.demo===!0)}
            @change=${this._demoChanged}
          />
          <span>${this.t("editor.demo")}</span>
        </label>

        <div class="hint advanced-note">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d=${Bn} /></svg>
          <span>${this.t("editor.advanced_note")}</span>
        </div>

        <fieldset class="header">
          <legend>${this.t("editor.header")}</legend>
          <div class="sub">
            ${this._row(d`<label class="check">
                <input
                  type="checkbox"
                  class="title-toggle"
                  .checked=${e}
                  @change=${this._titleChanged}
                />
                <span>${this.t("editor.name")}</span>
              </label>`,"title")}
            ${this._open.title?d`<div class="children">
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
                  </div>`:c}
            ${this._row(d`<label class="check">
              <input
                type="checkbox"
                class="main-switch"
                .checked=${a}
                @change=${this._mainSwitchChanged}
              />
              <span>${this.t("editor.main_switch")}</span>
            </label>`)}
            ${this._row(d`<label class="check">
              <input
                type="checkbox"
                class="history-toggle"
                .checked=${js(this._config)}
                @change=${b=>this._cornerChanged("history",b)}
              />
              <span>${this.t("editor.history")}</span>
            </label>`)}
            ${this._row(d`<label class="check">
              <input
                type="checkbox"
                class="settings-toggle"
                .checked=${Ns(this._config)}
                @change=${b=>this._cornerChanged("settings",b)}
              />
              <span>${this.t("editor.settings")}</span>
            </label>`)}
            ${this._row(d`<label class="check">
              <input
                type="checkbox"
                class="more-info-toggle"
                .checked=${Rs(this._config)}
                @change=${this._moreInfoChanged}
              />
              <span>${this.t("editor.more_info")}</span>
            </label>`)}
          </div>
        </fieldset>

        <fieldset class="controls">
          <legend>${this.t("editor.controls")}</legend>
          <div class="sub">
            ${this._row(d`<label class="check">
                <input
                  type="checkbox"
                  class="slider-toggle"
                  .checked=${i}
                  .indeterminate=${W(X)}
                  @change=${b=>this._controlChanged("slider",b)}
                />
                <span>${this.t($i.slider)}</span>
              </label>`,"slider")}
            ${this._open.slider?d`<div class="children">
                    ${xi.map(b=>this._row(d`
                        <label class="check ${i?"":"off"}">
                          <input
                            type="checkbox"
                            class="control-${b}"
                            .checked=${s.includes(b)}
                            ?disabled=${!i}
                            @change=${M=>this._controlChanged(b,M)}
                          />
                          <span>${this.t($i[b])}</span>
                        </label>
                      `))}
                    ${this._row(d`<label class="check ${i?"":"off"}">
                        <input
                          type="checkbox"
                          class="views-toggle"
                          .checked=${r}
                          .indeterminate=${W(ze)}
                          ?disabled=${!i}
                          @change=${this._viewsChanged}
                        />
                        <span>${this.t("editor.control.toggle")}</span>
                      </label>`,"views")}
                    ${this._open.views?d`<div class="children">
                            ${Ge.map(b=>d`
                                <label class="check ${i&&r?"":"off"}">
                                  <input
                                    type="checkbox"
                                    class="view-${b}"
                                    .checked=${n.includes(b)}
                                    ?disabled=${!i||!r}
                                    @change=${M=>this._viewChanged(b,M)}
                                  />
                                  <span>${this.t(fl[b])}</span>
                                </label>
                              `)}
                          </div>`:c}
                  </div>`:c}
            ${this._row(d`<label class="check">
                <input
                  type="checkbox"
                  class="features-toggle"
                  .checked=${l}
                  .indeterminate=${W(w)}
                  @change=${this._featuresChanged}
                />
                <span>${this.t("editor.features")}</span>
              </label>`,"features")}
            ${this._open.features?d`<div class="children">
                    ${We.map(b=>d`
                        <label class="check ${l?"":"off"}">
                          <input
                            type="checkbox"
                            class="tile-${b}"
                            .checked=${o.includes(b)}
                            ?disabled=${!l}
                            @change=${M=>this._tileChanged(b,M)}
                          />
                          <span>${this.t(gl[b])}</span>
                        </label>
                      `)}
                  </div>`:c}
            ${this._row(d`<label class="check">
                <input
                  type="checkbox"
                  class="boost"
                  .checked=${_}
                  @change=${this._boostChanged}
                />
                <span>${this.t("editor.boost")}</span>
              </label>`,"boost")}
            ${this._open.boost?d`<div class="children ${_?"":"off"}">
                    <label class="check">
                      <input
                        type="radio"
                        name="boost-kind"
                        class="boost-relative"
                        .checked=${W(!g)}
                        ?disabled=${!_}
                        @change=${()=>this._boostKindChanged(!1)}
                      />
                      <span>${this.t("editor.boost_relative")}</span>
                    </label>
                    <label class="check">
                      <input
                        type="radio"
                        name="boost-kind"
                        class="boost-absolute"
                        .checked=${W(g)}
                        ?disabled=${!_}
                        @change=${()=>this._boostKindChanged(!0)}
                      />
                      <span>${this.t("editor.boost_absolute")}</span>
                    </label>
                    <label class="number">
                      <span>${this.t(g?"common.temperature":"offset.label")}</span>
                      <input
                        type="number"
                        class="boost-value"
                        min=${this._boostLimit[0]}
                        max=${this._boostLimit[1]}
                        step="0.5"
                        .value=${W(typeof ie=="number"?String(ie):"")}
                        ?disabled=${!_}
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
                        max=${xo}
                        step="1"
                        .value=${W(typeof ae=="number"?String(ae):"")}
                        ?disabled=${!_}
                        @change=${this._boostDurationChanged}
                      />
                      <span class="unit">min</span>
                    </label>
                  </div>`:c}
            ${_&&!Zs(this._config,this._unit)?d`<div class="hint boost-invalid-hint indent">
                    ${this.t("editor.boost_invalid")}
                  </div>`:c}
            ${this._row(d`<label class="check">
                <input
                  type="checkbox"
                  class="reset"
                  .checked=${p}
                  .indeterminate=${W(v)}
                  @change=${this._resetChanged}
                />
                <span>${this.t("editor.reset")}</span>
              </label>`,"reset")}
            ${this._open.reset?d`<div class="children">
                    ${Ot.map(b=>d`
                        <label class="check ${p?"":"off"}">
                          <input
                            type="checkbox"
                            class="reset-field"
                            .checked=${f.includes(b)}
                            ?disabled=${!p}
                            @change=${M=>this._resetFieldChanged(b,M)}
                          />
                          <span>${this.t(Ps[b])}</span>
                        </label>
                      `)}
                  </div>`:c}
          </div>
        </fieldset>

        <fieldset class="status">
          <legend>${this.t("editor.status_cell")}</legend>
          <div class="sub">
            ${Ct.map(b=>d`
                ${this._row(d`<label class="check">
                    <input
                      type="checkbox"
                      class="section-${b}"
                      .checked=${(t==null?void 0:t.includes(b))??!1}
                      .indeterminate=${W(b==="panel"&&$)}
                      @change=${M=>this._sectionChanged(b,M)}
                    />
                    <span>${this.t(ml[b])}</span>
                  </label>`,b==="panel"?"panel":void 0)}
                ${b==="panel"&&this._open.panel?d`<div class="children">
                        <label class="check ${u?"":"off"}">
                          <input
                            type="checkbox"
                            class="battery"
                            .checked=${wo(this._config)}
                            ?disabled=${!u}
                            @change=${this._batteryChanged}
                          />
                          <span>${this.t("editor.battery")}</span>
                        </label>
                        <label class="check ${u?"":"off"}">
                          <input
                            type="checkbox"
                            class="deviations-badge"
                            .checked=${ko(this._config)}
                            ?disabled=${!u}
                            @change=${this._deviationsBadgeChanged}
                          />
                          <span>${this.t("editor.deviations_badge")}</span>
                        </label>
                      </div>`:c}
              `)}
          </div>
        </fieldset>
      </div>
    `}};R.styles=C`
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
      /* Starts where a checkbox or radio does: theirs carry the browser's
         default left margin. */
      padding-left: 4px;
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
    /* A row inside the options (one that expands further, and its siblings)
       puts its chevron column into the indent, so its checkbox lines up with
       every other option at that level (gutter 20px + gap 4px). Its own
       options then hang off that chevron: 9px in from it, not from the
       checkbox. */
    .children > .row {
      margin-left: -24px;
    }
    .children > .children {
      margin-left: -15px;
    }
    /* Hints stay outside the collapsed options, at their level. */
    .indent {
      padding-left: 48px;
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
  `,ot([m({attribute:!1})],R.prototype,"hass",2),ot([m({attribute:!1})],R.prototype,"lovelace",2),ot([D()],R.prototype,"_config",2),ot([D()],R.prototype,"_open",2),R=ot([L("climate-group-helper-card-editor")],R);var _l=Object.defineProperty,vl=Object.getOwnPropertyDescriptor,Lt=(e,t,o,s)=>{for(var i=s>1?void 0:s?vl(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&_l(t,o,i),i};let Me=class extends S{constructor(){super(...arguments),this.checked=!1,this.disabled=!1,this.label=""}_tap(){this.disabled||this.dispatchEvent(new CustomEvent("cgh-toggle",{detail:{checked:!this.checked},bubbles:!0,composed:!0}))}render(){return d`
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
    `}};Me.styles=C`
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
  `,Lt([m({type:Boolean})],Me.prototype,"checked",2),Lt([m({type:Boolean})],Me.prototype,"disabled",2),Lt([m()],Me.prototype,"label",2),Me=Lt([L("cgh-toggle")],Me);var yl=Object.defineProperty,wl=Object.getOwnPropertyDescriptor,Bo=(e,t,o,s)=>{for(var i=s>1?void 0:s?wl(t,o):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(i=(s?n(t,o,i):n(i))||i);return s&&i&&yl(t,o,i),i};const kl=new Set(["type","config_version","entity","name","title","more_info","history","settings","status","features","controls","views","battery","deviations_badge","main_switch","boost","reset","demo","grid_options","layout_options","visibility","view_layout"]);let st=class extends Y(S){setConfig(e){if(!e.entity&&!e.demo)throw new Error('climate-group-helper-card: "entity" is required');const t=bi(e);for(const o of Object.keys(t))kl.has(o)||console.warn(`[climate-group-helper-card] ignoring unknown config key: ${o}`);this._config=t,this._syncDemoTimer()}connectedCallback(){super.connectedCallback(),this._syncDemoTimer()}disconnectedCallback(){super.disconnectedCallback(),this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_syncDemoTimer(){var t;const e=!!((t=this._config)!=null&&t.demo);e&&this._demoTimer===void 0?(this._demoTimer=window.setInterval(()=>this.requestUpdate(),vi),this.requestUpdate()):!e&&this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_entityId(){var e,t;return(e=this._config)!=null&&e.demo?zo:(t=this._config)==null?void 0:t.entity}_effectiveHass(){var e,t;if(this.hass)return(e=this._config)!=null&&e.demo?{...this.hass,states:{...this.hass.states,...nl(Date.now(),((t=this.hass.locale)==null?void 0:t.language)??this.hass.language)},entities:Ur,callService:async()=>{}}:this.hass}getCardSize(){return 6}static getStubConfig(e,t=[],o=[]){const s="custom:climate-group-helper-card",i=Xe,a=[...t,...o],r=a.find(l=>Us(e,l))??a.find(l=>l.startsWith("climate."));return r?{type:s,config_version:i,entity:r}:{type:s,config_version:i,demo:!0}}_mainSwitch(e,t){if(!Fs(this._config))return;const o=t.attributes.main_switch_entity_id;return o?e.states[o]:void 0}_offsetEntity(e,t){const o=t.attributes.offset_entity_id;return o?e.states[o]:void 0}_handleMainSwitch(e){const t=this._effectiveHass();t&&t.callService("switch",e.state==="on"?"turn_off":"turn_on",{entity_id:e.entity_id})}static async getConfigElement(){return document.createElement("climate-group-helper-card-editor")}_renderStatus(e,t){var s,i;const o=_o(this._config);return!o||!o.length?c:d`
      <div class="status">
        <cgh-status
          .hass=${e}
          .stateObj=${t}
          .sections=${o}
          .battery=${wo(this._config)}
          .deviationsBadge=${ko(this._config)}
          .navigable=${!((s=this._config)!=null&&s.demo)}
          .quietWindow=${!((i=this._config)!=null&&i.demo)}
        ></cgh-status>
      </div>
    `}_openMoreInfo(e){var o;const t=this._entityId();!t||(o=this._config)!=null&&o.demo||this.dispatchEvent(new CustomEvent("hass-more-info",{detail:e?{entityId:t,view:e,tab:e}:{entityId:t},bubbles:!0,composed:!0}))}_cornerButtons(){var e,t;return[...js(this._config)?[{cls:"history",icon:On,label:this.t("card.history"),view:"history"}]:[],...Ns(this._config)&&((t=(e=this.hass)==null?void 0:e.user)==null?void 0:t.is_admin)!==!1?[{cls:"settings",icon:En,label:this.t("card.settings"),view:"settings"}]:[],...Rs(this._config)?[{cls:"more-info",icon:Sn,label:this.t("card.more_info")}]:[]]}render(){var f,_;const e=this._effectiveHass(),t=this._entityId();if(!this._config||!e||!t)return c;const o=e.states[t],s=$o(this._config);if(!o)return d`<ha-card class="warning"
        >${this.t("card.entity_not_found",{entity:t})}</ha-card
      >`;const i=this._mainSwitch(e,o),a=ar(o),n=this._config.name??o.attributes.friendly_name??t,r=Is(this._config),l=this._cornerButtons(),u=r?"in-header":l.length>1?"in-row":"",p=Math.max(48,i?64:0,l.length?l.length*40+16:0);return d`
      <ha-card>
        <div class="grid ${r?"":"no-header"}">
          ${r?d`<div class="title" style="--cgh-title-inset: ${p}px" title=${n}>
                  ${n}
                </div>`:d`<span class="sr-only">${n}</span>`}
          ${i?d`<cgh-toggle
                  class="main-switch ${u}"
                  .checked=${i.state==="on"}
                  .disabled=${i.state==="unavailable"||i.state==="unknown"}
                  .label=${this.t("main_switch.label")}
                  @cgh-toggle=${()=>this._handleMainSwitch(i)}
                ></cgh-toggle>`:c}
          ${l.length?d`<div class="corner-end ${u}">
                  ${l.map(g=>d`<button
                      class="corner-button ${g.cls}"
                      aria-label=${g.label}
                      title=${g.label}
                      @click=${()=>this._openMoreInfo(g.view)}
                    >
                      <svg viewBox="0 0 24 24"><path d=${g.icon} /></svg>
                    </button>`)}
                </div>`:c}
          ${s.includes("slider")?d`<div class="center">
                  <cgh-climate-control
                    .hass=${e}
                    .stateObj=${o}
                    .controls=${s}
                    .offsetObj=${this._offsetEntity(e,o)}
                    .views=${yo(this._config)}
                  ></cgh-climate-control>
                </div>`:c}
          <div class="features">
            <cgh-feature-tiles
              .hass=${e}
              .stateObj=${o}
              .tiles=${vo(this._config)}
              .boost=${a?Zs(this._config,(_=(f=e.config)==null?void 0:f.unit_system)==null?void 0:_.temperature):null}
              .reset=${a?Et(this._config):[]}
            ></cgh-feature-tiles>
          </div>
          ${this._renderStatus(e,o)}
        </div>
      </ha-card>
    `}};st.styles=C`
    :host {
      display: block;
      height: 100%;
      /* Shared content column: the dial and everything below it stay within
         this width, centred — nothing is drawn past the slider's edges. */
      --cgh-content-width: 320px;
      /* The corner a theme gives its card, for the card's own surfaces (the
         tiles, the status panel, the deviations box — the two boxes capped):
         its controls radius as HA's tile features take it, else the card's
         own. Left without a value when the theme sets neither — each surface
         then keeps its own default, so the standard theme looks as before. */
      --cgh-surface-radius: var(
        --ha-card-features-border-radius,
        var(--ha-card-border-radius)
      );
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
    /* The right corner: history, settings, ⋮ — 40px each, so three leave
       the name room. */
    .corner-end {
      display: flex;
    }
    .corner-button {
      width: 40px;
      height: 40px;
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
    .corner-button:hover,
    .corner-button:focus-visible {
      /* Light, theme-adaptive fill (like HA's own header buttons) — not the
         dark secondary surface, which read as a black circle. */
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      color: var(--primary-text-color);
      outline: none;
    }
    .corner-button svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
    /* The title alone sets the header row's height, at least 48px — also for
       a blank name. Its line sits 4px low (12px above, 4px below), on the
       middle of the corners, which stand 8px from the top like they do
       without a header. Symmetrical side padding, as wide as the wider
       corner (set by the card), keeps it centred and clear of both. */
    .title {
      grid-area: header;
      box-sizing: border-box;
      min-height: 48px;
      padding: 12px var(--cgh-title-inset, 48px) 4px;
      /* One line, cut with an ellipsis: with three buttons a wrapped name
         would stack up and stretch the row. The full name is its tooltip. */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ha-font-size-l, 1.1rem);
      font-weight: 400;
      line-height: var(--ha-line-height-expanded, 2);
      text-align: center;
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
    /* The switch top left, 16px from the card edge, the buttons top right,
       all centred on the same line. Without the name they go to the corners
       of the dial's area, clear of the ring from 320px card width on; without
       the dial they stand above the feature tiles. */
    .main-switch,
    .corner-end {
      grid-area: center;
      align-self: start;
      z-index: 1;
    }
    /* No top margin: both corners are 40px boxes on one line, and the row
       keeps the header's height whether the switch is there or not. */
    .main-switch {
      justify-self: start;
      margin-left: 16px;
    }
    /* 8px edge: with the icon's own 9px inside its 40px box, it stands about
       as far from the edge as the switch. */
    .corner-end {
      justify-self: end;
      margin-right: 8px;
    }
    /* Narrower, the ring reaches the corners: they take a row of their own. */
    @container (max-width: 319px) {
      .main-switch,
      .corner-end {
        grid-area: switch;
      }
    }
    /* More than one button on the right reaches into the ring at any width.
       The grid's 8px and the 40px boxes make the header's 48px, so the dial
       starts at the same height either way. */
    .main-switch.in-row,
    .corner-end.in-row {
      grid-area: switch;
    }
    /* After the container query: the header row wins at every width. The
       corners stand 8px from the top here too, as everywhere else, on the
       same line as the name (see .title). */
    .main-switch.in-header,
    .corner-end.in-header {
      grid-area: header;
      margin-top: 8px;
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
  `,Bo([m({attribute:!1})],st.prototype,"hass",2),Bo([D()],st.prototype,"_config",2),st=Bo([L("climate-group-helper-card")],st),ga({type:"climate-group-helper-card",name:"Climate Group Helper Card",description:"Dial, status and controls for a Climate Group Helper group.",preview:!0,getEntitySuggestion:(e,t)=>Us(e,t)?{label:"Climate Group Helper",config:{type:"custom:climate-group-helper-card",config_version:Xe,entity:t}}:null})})();
