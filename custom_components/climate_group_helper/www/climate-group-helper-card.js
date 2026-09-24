(function(){"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var fo;const ke=globalThis,Ke=ke.ShadowRoot&&(ke.ShadyCSS===void 0||ke.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Be=Symbol(),kt=new WeakMap;let At=class{constructor(e,o,i){if(this._$cssResult$=!0,i!==Be)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=o}get styleSheet(){let e=this.o;const o=this.t;if(Ke&&e===void 0){const i=o!==void 0&&o.length===1;i&&(e=kt.get(o)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&kt.set(o,e))}return e}toString(){return this.cssText}};const Do=t=>new At(typeof t=="string"?t:t+"",void 0,Be),k=(t,...e)=>{const o=t.length===1?t[0]:e.reduce((i,s,n)=>i+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[n+1],t[0]);return new At(o,t,Be)},Ho=(t,e)=>{if(Ke)t.adoptedStyleSheets=e.map(o=>o instanceof CSSStyleSheet?o:o.styleSheet);else for(const o of e){const i=document.createElement("style"),s=ke.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=o.cssText,t.appendChild(i)}},Ct=Ke?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let o="";for(const i of e.cssRules)o+=i.cssText;return Do(o)})(t):t;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Vo,defineProperty:zo,getOwnPropertyDescriptor:jo,getOwnPropertyNames:Io,getOwnPropertySymbols:Ro,getPrototypeOf:No}=Object,P=globalThis,Et=P.trustedTypes,Uo=Et?Et.emptyScript:"",Fe=P.reactiveElementPolyfillSupport,ce=(t,e)=>t,Ae={toAttribute(t,e){switch(e){case Boolean:t=t?Uo:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let o=t;switch(e){case Boolean:o=t!==null;break;case Number:o=t===null?null:Number(t);break;case Object:case Array:try{o=JSON.parse(t)}catch{o=null}}return o}},We=(t,e)=>!Vo(t,e),St={attribute:!0,type:String,converter:Ae,reflect:!1,useDefault:!1,hasChanged:We};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),P.litPropertyMetadata??(P.litPropertyMetadata=new WeakMap);let Z=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,o=St){if(o.state&&(o.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((o=Object.create(o)).wrapped=!0),this.elementProperties.set(e,o),!o.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,o);s!==void 0&&zo(this.prototype,e,s)}}static getPropertyDescriptor(e,o,i){const{get:s,set:n}=jo(this.prototype,e)??{get(){return this[o]},set(a){this[o]=a}};return{get:s,set(a){const l=s==null?void 0:s.call(this);n==null||n.call(this,a),this.requestUpdate(e,l,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??St}static _$Ei(){if(this.hasOwnProperty(ce("elementProperties")))return;const e=No(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(ce("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ce("properties"))){const o=this.properties,i=[...Io(o),...Ro(o)];for(const s of i)this.createProperty(s,o[s])}const e=this[Symbol.metadata];if(e!==null){const o=litPropertyMetadata.get(e);if(o!==void 0)for(const[i,s]of o)this.elementProperties.set(i,s)}this._$Eh=new Map;for(const[o,i]of this.elementProperties){const s=this._$Eu(o,i);s!==void 0&&this._$Eh.set(s,o)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const o=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const s of i)o.unshift(Ct(s))}else e!==void 0&&o.push(Ct(e));return o}static _$Eu(e,o){const i=o.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(o=>this.enableUpdating=o),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(o=>o(this))}addController(e){var o;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((o=e.hostConnected)==null||o.call(e))}removeController(e){var o;(o=this._$EO)==null||o.delete(e)}_$E_(){const e=new Map,o=this.constructor.elementProperties;for(const i of o.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ho(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(o=>{var i;return(i=o.hostConnected)==null?void 0:i.call(o)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(o=>{var i;return(i=o.hostDisconnected)==null?void 0:i.call(o)})}attributeChangedCallback(e,o,i){this._$AK(e,i)}_$ET(e,o){var n;const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(s!==void 0&&i.reflect===!0){const a=(((n=i.converter)==null?void 0:n.toAttribute)!==void 0?i.converter:Ae).toAttribute(o,i.type);this._$Em=e,a==null?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(e,o){var n,a;const i=this.constructor,s=i._$Eh.get(e);if(s!==void 0&&this._$Em!==s){const l=i.getPropertyOptions(s),r=typeof l.converter=="function"?{fromAttribute:l.converter}:((n=l.converter)==null?void 0:n.fromAttribute)!==void 0?l.converter:Ae;this._$Em=s;const u=r.fromAttribute(o,l.type);this[s]=u??((a=this._$Ej)==null?void 0:a.get(s))??u,this._$Em=null}}requestUpdate(e,o,i,s=!1,n){var a;if(e!==void 0){const l=this.constructor;if(s===!1&&(n=this[e]),i??(i=l.getPropertyOptions(e)),!((i.hasChanged??We)(n,o)||i.useDefault&&i.reflect&&n===((a=this._$Ej)==null?void 0:a.get(e))&&!this.hasAttribute(l._$Eu(e,i))))return;this.C(e,o,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,o,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??o??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(o=void 0),this._$AL.set(e,o)),s===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(o){Promise.reject(o)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[n,a]of this._$Ep)this[n]=a;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[n,a]of s){const{wrapped:l}=a,r=this[n];l!==!0||this._$AL.has(n)||r===void 0||this.C(n,void 0,a,r)}}let e=!1;const o=this._$AL;try{e=this.shouldUpdate(o),e?(this.willUpdate(o),(i=this._$EO)==null||i.forEach(s=>{var n;return(n=s.hostUpdate)==null?void 0:n.call(s)}),this.update(o)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(o)}willUpdate(e){}_$AE(e){var o;(o=this._$EO)==null||o.forEach(i=>{var s;return(s=i.hostUpdated)==null?void 0:s.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(o=>this._$ET(o,this[o]))),this._$EM()}updated(e){}firstUpdated(e){}};Z.elementStyles=[],Z.shadowRootOptions={mode:"open"},Z[ce("elementProperties")]=new Map,Z[ce("finalized")]=new Map,Fe==null||Fe({ReactiveElement:Z}),(P.reactiveElementVersions??(P.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const de=globalThis,Mt=t=>t,Ce=de.trustedTypes,Ot=Ce?Ce.createPolicy("lit-html",{createHTML:t=>t}):void 0,Lt="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,Tt="?"+D,Ko=`<${Tt}>`,R=document,ue=()=>R.createComment(""),he=t=>t===null||typeof t!="object"&&typeof t!="function",Ge=Array.isArray,Bo=t=>Ge(t)||typeof(t==null?void 0:t[Symbol.iterator])=="function",Ze=`[ 	
\f\r]`,me=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Pt=/-->/g,Dt=/>/g,N=RegExp(`>|${Ze}(?:([^\\s"'>=/]+)(${Ze}*=${Ze}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ht=/'/g,Vt=/"/g,zt=/^(?:script|style|textarea|title)$/i,jt=t=>(e,...o)=>({_$litType$:t,strings:e,values:o}),d=jt(1),q=jt(2),U=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),It=new WeakMap,K=R.createTreeWalker(R,129);function Rt(t,e){if(!Ge(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ot!==void 0?Ot.createHTML(e):e}const Fo=(t,e)=>{const o=t.length-1,i=[];let s,n=e===2?"<svg>":e===3?"<math>":"",a=me;for(let l=0;l<o;l++){const r=t[l];let u,h,f=-1,w=0;for(;w<r.length&&(a.lastIndex=w,h=a.exec(r),h!==null);)w=a.lastIndex,a===me?h[1]==="!--"?a=Pt:h[1]!==void 0?a=Dt:h[2]!==void 0?(zt.test(h[2])&&(s=RegExp("</"+h[2],"g")),a=N):h[3]!==void 0&&(a=N):a===N?h[0]===">"?(a=s??me,f=-1):h[1]===void 0?f=-2:(f=a.lastIndex-h[2].length,u=h[1],a=h[3]===void 0?N:h[3]==='"'?Vt:Ht):a===Vt||a===Ht?a=N:a===Pt||a===Dt?a=me:(a=N,s=void 0);const x=a===N&&t[l+1].startsWith("/>")?" ":"";n+=a===me?r+Ko:f>=0?(i.push(u),r.slice(0,f)+Lt+r.slice(f)+D+x):r+D+(f===-2?l:x)}return[Rt(t,n+(t[o]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]};class pe{constructor({strings:e,_$litType$:o},i){let s;this.parts=[];let n=0,a=0;const l=e.length-1,r=this.parts,[u,h]=Fo(e,o);if(this.el=pe.createElement(u,i),K.currentNode=this.el.content,o===2||o===3){const f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(s=K.nextNode())!==null&&r.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(const f of s.getAttributeNames())if(f.endsWith(Lt)){const w=h[a++],x=s.getAttribute(f).split(D),T=/([.?@])?(.*)/.exec(w);r.push({type:1,index:n,name:T[2],strings:x,ctor:T[1]==="."?Go:T[1]==="?"?Zo:T[1]==="@"?qo:Ee}),s.removeAttribute(f)}else f.startsWith(D)&&(r.push({type:6,index:n}),s.removeAttribute(f));if(zt.test(s.tagName)){const f=s.textContent.split(D),w=f.length-1;if(w>0){s.textContent=Ce?Ce.emptyScript:"";for(let x=0;x<w;x++)s.append(f[x],ue()),K.nextNode(),r.push({type:2,index:++n});s.append(f[w],ue())}}}else if(s.nodeType===8)if(s.data===Tt)r.push({type:2,index:n});else{let f=-1;for(;(f=s.data.indexOf(D,f+1))!==-1;)r.push({type:7,index:n}),f+=D.length-1}n++}}static createElement(e,o){const i=R.createElement("template");return i.innerHTML=e,i}}function Y(t,e,o=t,i){var a,l;if(e===U)return e;let s=i!==void 0?(a=o._$Co)==null?void 0:a[i]:o._$Cl;const n=he(e)?void 0:e._$litDirective$;return(s==null?void 0:s.constructor)!==n&&((l=s==null?void 0:s._$AO)==null||l.call(s,!1),n===void 0?s=void 0:(s=new n(t),s._$AT(t,o,i)),i!==void 0?(o._$Co??(o._$Co=[]))[i]=s:o._$Cl=s),s!==void 0&&(e=Y(t,s._$AS(t,e.values),s,i)),e}class Wo{constructor(e,o){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=o}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:o},parts:i}=this._$AD,s=((e==null?void 0:e.creationScope)??R).importNode(o,!0);K.currentNode=s;let n=K.nextNode(),a=0,l=0,r=i[0];for(;r!==void 0;){if(a===r.index){let u;r.type===2?u=new fe(n,n.nextSibling,this,e):r.type===1?u=new r.ctor(n,r.name,r.strings,this,e):r.type===6&&(u=new Yo(n,this,e)),this._$AV.push(u),r=i[++l]}a!==(r==null?void 0:r.index)&&(n=K.nextNode(),a++)}return K.currentNode=R,s}p(e){let o=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,o),o+=i.strings.length-2):i._$AI(e[o])),o++}}class fe{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,o,i,s){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=e,this._$AB=o,this._$AM=i,this.options=s,this._$Cv=(s==null?void 0:s.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const o=this._$AM;return o!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=o.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,o=this){e=Y(this,e,o),he(e)?e===c||e==null||e===""?(this._$AH!==c&&this._$AR(),this._$AH=c):e!==this._$AH&&e!==U&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Bo(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==c&&he(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){var n;const{values:o,_$litType$:i}=e,s=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=pe.createElement(Rt(i.h,i.h[0]),this.options)),i);if(((n=this._$AH)==null?void 0:n._$AD)===s)this._$AH.p(o);else{const a=new Wo(s,this),l=a.u(this.options);a.p(o),this.T(l),this._$AH=a}}_$AC(e){let o=It.get(e.strings);return o===void 0&&It.set(e.strings,o=new pe(e)),o}k(e){Ge(this._$AH)||(this._$AH=[],this._$AR());const o=this._$AH;let i,s=0;for(const n of e)s===o.length?o.push(i=new fe(this.O(ue()),this.O(ue()),this,this.options)):i=o[s],i._$AI(n),s++;s<o.length&&(this._$AR(i&&i._$AB.nextSibling,s),o.length=s)}_$AR(e=this._$AA.nextSibling,o){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,o);e!==this._$AB;){const s=Mt(e).nextSibling;Mt(e).remove(),e=s}}setConnected(e){var o;this._$AM===void 0&&(this._$Cv=e,(o=this._$AP)==null||o.call(this,e))}}class Ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,o,i,s,n){this.type=1,this._$AH=c,this._$AN=void 0,this.element=e,this.name=o,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=c}_$AI(e,o=this,i,s){const n=this.strings;let a=!1;if(n===void 0)e=Y(this,e,o,0),a=!he(e)||e!==this._$AH&&e!==U,a&&(this._$AH=e);else{const l=e;let r,u;for(e=n[0],r=0;r<n.length-1;r++)u=Y(this,l[i+r],o,r),u===U&&(u=this._$AH[r]),a||(a=!he(u)||u!==this._$AH[r]),u===c?e=c:e!==c&&(e+=(u??"")+n[r+1]),this._$AH[r]=u}a&&!s&&this.j(e)}j(e){e===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Go extends Ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===c?void 0:e}}class Zo extends Ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==c)}}class qo extends Ee{constructor(e,o,i,s,n){super(e,o,i,s,n),this.type=5}_$AI(e,o=this){if((e=Y(this,e,o,0)??c)===U)return;const i=this._$AH,s=e===c&&i!==c||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==c&&(i===c||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var o;typeof this._$AH=="function"?this._$AH.call(((o=this.options)==null?void 0:o.host)??this.element,e):this._$AH.handleEvent(e)}}class Yo{constructor(e,o,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=o,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const qe=de.litHtmlPolyfillSupport;qe==null||qe(pe,fe),(de.litHtmlVersions??(de.litHtmlVersions=[])).push("3.3.3");const Jo=(t,e,o)=>{const i=(o==null?void 0:o.renderBefore)??e;let s=i._$litPart$;if(s===void 0){const n=(o==null?void 0:o.renderBefore)??null;i._$litPart$=s=new fe(e.insertBefore(ue(),n),n,void 0,o??{})}return s._$AI(t),s};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const B=globalThis;let $=class extends Z{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var o;const e=super.createRenderRoot();return(o=this.renderOptions).renderBefore??(o.renderBefore=e.firstChild),e}update(e){const o=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Jo(o,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return U}};$._$litElement$=!0,$.finalized=!0,(fo=B.litElementHydrateSupport)==null||fo.call(B,{LitElement:$});const Ye=B.litElementPolyfillSupport;Ye==null||Ye({LitElement:$}),(B.litElementVersions??(B.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Xo={attribute:!0,type:String,converter:Ae,reflect:!1,hasChanged:We},Qo=(t=Xo,e,o)=>{const{kind:i,metadata:s}=o;let n=globalThis.litPropertyMetadata.get(s);if(n===void 0&&globalThis.litPropertyMetadata.set(s,n=new Map),i==="setter"&&((t=Object.create(t)).wrapped=!0),n.set(o.name,t),i==="accessor"){const{name:a}=o;return{set(l){const r=e.get.call(this);e.set.call(this,l),this.requestUpdate(a,r,t,!0,l)},init(l){return l!==void 0&&this.C(a,void 0,t,l),l}}}if(i==="setter"){const{name:a}=o;return function(l){const r=this[a];e.call(this,l),this.requestUpdate(a,r,t,!0,l)}}throw Error("Unsupported decorator location: "+i)};function p(t){return(e,o)=>typeof o=="object"?Qo(t,e,o):((i,s,n)=>{const a=s.hasOwnProperty(n);return s.constructor.createProperty(n,i),a?Object.getOwnPropertyDescriptor(s,n):void 0})(t,e,o)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function A(t){return p({...t,state:!0,attribute:!1})}const Nt=document.querySelector("home-assistant")&&!customElements.get("home-assistant")?customElements.whenDefined("home-assistant"):void 0,Ut=(t,e)=>{customElements.get(t)||customElements.define(t,e)},E=t=>e=>{Nt?Nt.then(()=>Ut(t,e)):Ut(t,e)},ei=t=>{window.customCards=window.customCards||[],window.customCards.some(e=>e.type===t.type)||window.customCards.push(t)},J=270,Kt=360-J/2-90,M=145,Je=320,Bt=Je/2,Xe=M*2*Math.PI*J/360,Se=((t,e)=>{const o=t/180*Math.PI,i=e/180*Math.PI,s=i-o,n=M*Math.cos(o),a=M*Math.sin(o),l=M*Math.cos(i),r=M*Math.sin(i);return`M ${n} ${a} A ${M} ${M} 0 ${s>Math.PI?1:0} ${s>0?1:0} ${l} ${r}`})(0,J),Qe=(t,e,o)=>o===e?0:(t-e)/(o-e),et=(t,e,o)=>Qe(t,e,o)*J,ti=(t,e,o,i)=>{const s=Qe(t,o,i),n=Qe(e,o,i),a=Math.max((n-s)*Xe,0);return[`${a} ${Xe-a}`,`-${s*Xe-.5}`]},tt=(t,e,o,i)=>{const s=Math.round(t/i)*i;return Math.min(o,Math.max(e,Number(s.toFixed(4))))},oi=(t,e,o)=>{if(!o.width)return 0;const i=2*(t-o.left-o.width/2)/o.width,s=2*(e-o.top-o.height/2)/o.height,n=Math.atan2(s,i)*180/Math.PI,a=(360-J)/2,l=(n+a-Kt+360)%360-a;return Math.min(1,Math.max(0,l/J))},ii=(t,e,o,i)=>i?Math.abs(t-e)<=Math.abs(t-o)?"low":"high":"value",si=(t,e,o,i)=>o?t<=e:i==="end"?e<=t:i==="start"?t<=e:!1;var ni=Object.defineProperty,ai=Object.getOwnPropertyDescriptor,y=(t,e,o,i)=>{for(var s=i>1?void 0:i?ai(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&ni(e,o,s),s};const Ft=["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","Home","End"];let v=class extends ${constructor(){super(...arguments),this.min=5,this.max=35,this.step=.5,this.dual=!1,this.disabled=!1,this.mode="full",this.inactive=!1,this.bound="low"}willUpdate(t){t.has("value")&&this._active!=="value"&&(this._localValue=this.value),t.has("low")&&this._active!=="low"&&(this._localLow=this.low),t.has("high")&&this._active!=="high"&&(this._localHigh=this.high)}_valueFromEvent(t){var o;const e=(o=this._svg)==null?void 0:o.getBoundingClientRect();return e?this.min+oi(t.clientX,t.clientY,e)*(this.max-this.min):this.min}_setActiveValue(t){const e=tt(t,this.min,this.max,this.step);this._active==="low"?this._localLow=Math.min(e,this._localHigh??this.max):this._active==="high"?this._localHigh=Math.max(e,this._localLow??this.min):this._localValue=e}_activeValue(){if(this._active==="low")return this._localLow;if(this._active==="high")return this._localHigh;if(this._active==="value")return this._localValue}_committedValue(){return this._active==="low"?this.low:this._active==="high"?this.high:this.value}_commit(){this._active&&(this._activeValue()!==this._committedValue()&&this._emit("changed"),this._active=void 0)}_emit(t){if(!this._active)return;const e=t==="changed"?this._activeValue():void 0;this.dispatchEvent(new CustomEvent(`${this._active}-${t}`,{detail:{value:e},bubbles:!0,composed:!0}))}_onPointerDown(t){if(this.disabled||this._active)return;const e=this._valueFromEvent(t);this._active=ii(e,this._localLow??this.min,this._localHigh??this.max,this.dual),this._pointerId=t.pointerId,this._setActiveValue(e),t.currentTarget.setPointerCapture(t.pointerId),this._emit("changing")}_onPointerMove(t){!this._active||t.pointerId!==this._pointerId||(this._setActiveValue(this._valueFromEvent(t)),this._emit("changing"))}_onPointerUp(t){!this._active||t.pointerId!==this._pointerId||(t.currentTarget.releasePointerCapture(t.pointerId),this._pointerId=void 0,this._commit())}_onKeyDown(t){if(this.disabled||this._pointerId!==void 0||!Ft.includes(t.code))return;t.preventDefault(),this._active||(this._active=this.dual?this.bound:"value");const e=this._activeValue()??this.min;switch(t.code){case"ArrowRight":case"ArrowUp":this._setActiveValue(e+this.step);break;case"ArrowLeft":case"ArrowDown":this._setActiveValue(e-this.step);break;case"Home":this._setActiveValue(this.min);break;case"End":this._setActiveValue(this.max);break}this._emit("changing")}_onKeyUp(t){this._pointerId!==void 0||!Ft.includes(t.code)||this._commit()}_onBlur(){this._pointerId===void 0&&this._commit()}_fill(t,e,o,i=!1,s=!1){const[n,a]=ti(t,e,this.min,this.max);return q`
      ${s?q`<path
              class="fill-clear"
              d=${Se}
              stroke-dasharray=${n}
              stroke-dashoffset=${a}
            />`:c}
      <path
        class="fill ${o}${i?" active":""}"
        d=${Se}
        stroke-dasharray=${n}
        stroke-dashoffset=${a}
      />
    `}_handle(t,e){return q`
      <circle
        class="handle-ring ${e}"
        transform="rotate(${et(t,this.min,this.max)} 0 0)"
        cx=${M}
        cy="0"
        r="12"
      />
      <circle
        class="handle"
        transform="rotate(${et(t,this.min,this.max)} 0 0)"
        cx=${M}
        cy="0"
        r="9"
      />
    `}_currentMarker(t){return q`<circle
      class="current"
      transform="rotate(${et(t,this.min,this.max)} 0 0)"
      cx=${M}
      cy="0"
      r="4"
    />`}render(){const t=this.current,e=t!=null&&t>=this.min&&t<=this.max,o=e&&!this.inactive,i=this.dual?this._localLow:this._localValue,s=this.dual?this._localHigh:void 0,n=o&&i!=null&&si(t,i,this.dual,this.mode),a=o&&s!=null&&s<=t;return d`
      <svg
        viewBox="0 0 ${Je} ${Je}"
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
          transform="translate(${Bt} ${Bt}) rotate(${Kt})"
        >
          <path class="track" d=${Se} />
          ${this.dual?q`
                  ${i!=null?this._fill(this.min,i,"low",!1,!0):c}
                  ${s!=null?this._fill(s,this.max,"high",!1,!0):c}
                  ${n?this._fill(t,i,"low",!0):c}
                  ${a?this._fill(s,t,"high",!0):c}
                  ${e?this._currentMarker(t):c}
                  ${i!=null?this._handle(i,"low"):c}
                  ${s!=null?this._handle(s,"high"):c}
                `:q`
                  ${i!=null?this.mode==="end"?this._fill(i,this.max,"value",!1,!0):this.mode==="full"?this._fill(this.min,this.max,"value",!1,!0):this._fill(this.min,i,"value",!1,!0):c}
                  ${n?this.mode==="end"?this._fill(i,t,"value",!0):this._fill(t,i,"value",!0):c}
                  ${e?this._currentMarker(t):c}
                  ${i!=null?this._handle(i,"value"):c}
                `}
          <path
            class="interaction"
            d=${Se}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          />
        </g>
      </svg>
    `}firstUpdated(){this._svg=this.renderRoot.querySelector("svg")??void 0}};v.styles=k`
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
  `,y([p({type:Number})],v.prototype,"min",2),y([p({type:Number})],v.prototype,"max",2),y([p({type:Number})],v.prototype,"step",2),y([p({type:Number})],v.prototype,"value",2),y([p({type:Number})],v.prototype,"low",2),y([p({type:Number})],v.prototype,"high",2),y([p({type:Number})],v.prototype,"current",2),y([p({type:Boolean})],v.prototype,"dual",2),y([p({type:Boolean,reflect:!0})],v.prototype,"disabled",2),y([p({type:String})],v.prototype,"mode",2),y([p({type:Boolean,reflect:!0})],v.prototype,"inactive",2),y([p({type:String})],v.prototype,"bound",2),y([A()],v.prototype,"_localValue",2),y([A()],v.prototype,"_localLow",2),y([A()],v.prototype,"_localHigh",2),y([A()],v.prototype,"_active",2),v=y([E("cgh-circular-slider")],v);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ri={ATTRIBUTE:1},li=t=>(...e)=>({_$litDirective$:t,values:e});let ci=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,o,i){this._$Ct=e,this._$AM=o,this._$Ci=i}_$AS(e,o){return this.update(e,o)}update(e,o){return this.render(...o)}};/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Wt="important",di=" !"+Wt,Me=li(class extends ci{constructor(t){var e;if(super(t),t.type!==ri.ATTRIBUTE||t.name!=="style"||((e=t.strings)==null?void 0:e.length)>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(t){return Object.keys(t).reduce((e,o)=>{const i=t[o];return i==null?e:e+`${o=o.includes("-")?o:o.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${i};`},"")}update(t,[e]){const{style:o}=t.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(e)),this.render(e);for(const i of this.ft)e[i]==null&&(this.ft.delete(i),i.includes("-")?o.removeProperty(i):o[i]=null);for(const i in e){const s=e[i];if(s!=null){this.ft.add(i);const n=typeof s=="string"&&s.endsWith(di);i.includes("-")||n?o.setProperty(i,n?s.slice(0,-11):s,n?Wt:""):o[i]=s}}return U}}),Oe={en:{"action.cooling":"Cooling","action.drying":"Drying","action.fan":"Fan","action.heating":"Heating","action.idle":"Idle","action.off":"Off","block.presence":"Away","block.switch":"Main switch off","block.window":"Window open","card.entity_not_found":"Entity not found: {entity}","card.more_info":"More info","common.decrease":"Decrease","common.humidity":"Humidity","common.increase":"Increase","common.temperature":"Temperature","demo.group":"Demo group","demo.room.bathroom":"Bathroom","demo.room.bedroom":"Bedroom","demo.room.kitchen":"Kitchen","demo.room.living_room":"Living room","demo.schedule":"Demo schedule","demo.slot":"Demo slot","editor.demo":"Demo mode (synthetic data; no entity needed)","editor.feature_tiles":"Feature tiles","editor.group_entity":"Group entity","editor.hide_status":"Hide the status cell","editor.section.badges":"Badges","editor.section.deviations":"Deviations","editor.section.panel":"Panel","editor.status_cell":"Status cell","editor.title":"Title","editor.title_placeholder":"Use the entity name","feature.calibration":"Calibration","feature.isolation":"Isolation","feature.presence":"Presence","feature.schedule":"Schedule","feature.sync":"Sync","feature.window":"Window","humidity.target":"Humidity target","member.unavailable":"Unavailable","mode.auto":"Auto","mode.cool":"Cool","mode.dry":"Dry","mode.fan_only":"Fan only","mode.heat":"Heat","mode.heat_cool":"Heat/Cool","mode.off":"Off","source.manual":"Manual","source.mirror":"Mirror","source.schedule":"Schedule","source.sync":"Sync","source.window":"Window","status.active":"Active","status.blocking_for":"for {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergence","status.hold":"Hold {minutes} min","status.isolated":"{count} isolated","status.next":"Next {time}","status.no_deviations":"No deviations","status.oob":"{count} out of bounds","tile.fan":"Fan mode","tile.mode":"Mode","tile.preset":"Preset","tile.swing":"Swing mode","tile.swing_horizontal":"Horizontal swing"},cs:{"action.cooling":"Chlazení","action.drying":"Odvlhčování","action.fan":"Ventilátor","action.heating":"Topení","action.idle":"Nečinný","action.off":"Vypnuto","block.presence":"Nepřítomen","block.switch":"Hlavní vypínač vypnut","block.window":"Okno otevřeno","card.entity_not_found":"Entita nenalezena: {entity}","card.more_info":"Více informací","common.decrease":"Snížit","common.humidity":"Vlhkost","common.increase":"Zvýšit","common.temperature":"Teplota","demo.group":"Demo skupina","demo.room.bathroom":"Koupelna","demo.room.bedroom":"Ložnice","demo.room.kitchen":"Kuchyně","demo.room.living_room":"Obývací pokoj","demo.schedule":"Demo plán","demo.slot":"Demo úsek","editor.demo":"Režim ukázky (syntetická data; není potřeba entita)","editor.feature_tiles":"Dlaždice funkcí","editor.group_entity":"Entita skupiny","editor.hide_status":"Skrýt stavovou buňku","editor.section.badges":"Odznaky","editor.section.deviations":"Odchylky","editor.section.panel":"Panel","editor.status_cell":"Stavová buňka","editor.title":"Název","editor.title_placeholder":"Použít název entity","feature.calibration":"Kalibrace","feature.isolation":"Izolace","feature.presence":"Přítomnost","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cílová vlhkost","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chlazení","mode.dry":"Odvlhčování","mode.fan_only":"Pouze ventilátor","mode.heat":"Topení","mode.heat_cool":"Topení/Chlazení","mode.off":"Vypnuto","source.manual":"Ručně","source.mirror":"Zrcadlení","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Aktivní","status.blocking_for":"už {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchylka","status.hold":"Podržet {minutes} min","status.isolated":"{count} izolováno","status.next":"Další {time}","status.no_deviations":"Žádné odchylky","status.oob":"{count} mimo rozsah","tile.fan":"Režim ventilátoru","tile.mode":"Režim","tile.preset":"Předvolba","tile.swing":"Režim natáčení","tile.swing_horizontal":"Vodorovné natáčení"},da:{"action.cooling":"Køler","action.drying":"Affugter","action.fan":"Ventilator","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Slukket","block.presence":"Ikke hjemme","block.switch":"Hovedafbryder slukket","block.window":"Vindue åbent","card.entity_not_found":"Enhed ikke fundet: {entity}","card.more_info":"Mere info","common.decrease":"Reducér","common.humidity":"Luftfugtighed","common.increase":"Forøg","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.room.bathroom":"Badeværelse","demo.room.bedroom":"Soveværelse","demo.room.kitchen":"Køkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrum","editor.demo":"Demotilstand (syntetiske data; ingen enhed nødvendig)","editor.feature_tiles":"Funktionsfliser","editor.group_entity":"Gruppeenhed","editor.hide_status":"Skjul statusfeltet","editor.section.badges":"Mærkater","editor.section.deviations":"Afvigelser","editor.section.panel":"Panel","editor.status_cell":"Statusfelt","editor.title":"Titel","editor.title_placeholder":"Brug enhedens navn","feature.calibration":"Kalibrering","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindue","humidity.target":"Ønsket luftfugtighed","member.unavailable":"Utilgængelig","mode.auto":"Automatisk","mode.cool":"Køling","mode.dry":"Affugtning","mode.fan_only":"Kun ventilator","mode.heat":"Varme","mode.heat_cool":"Varme/Køling","mode.off":"Slukket","source.manual":"Manuel","source.mirror":"Spejling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindue","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} afvigelse","status.hold":"Hold {minutes} min","status.isolated":"{count} isoleret","status.next":"Næste {time}","status.no_deviations":"Ingen afvigelser","status.oob":"{count} uden for området","tile.fan":"Ventilatortilstand","tile.mode":"Tilstand","tile.preset":"Forudindstilling","tile.swing":"Svingtilstand","tile.swing_horizontal":"Vandret sving"},de:{"action.cooling":"Kühlen","action.drying":"Trocknen","action.fan":"Lüfter","action.heating":"Heizen","action.idle":"Bereit","action.off":"Aus","block.presence":"Abwesend","block.switch":"Hauptschalter aus","block.window":"Fenster offen","card.entity_not_found":"Entität nicht gefunden: {entity}","card.more_info":"Mehr Infos","common.decrease":"Verringern","common.humidity":"Luftfeuchte","common.increase":"Erhöhen","common.temperature":"Temperatur","demo.group":"Demo-Gruppe","demo.room.bathroom":"Bad","demo.room.bedroom":"Schlafzimmer","demo.room.kitchen":"Küche","demo.room.living_room":"Wohnzimmer","demo.schedule":"Demo-Zeitplan","demo.slot":"Demo-Zeitblock","editor.demo":"Demo-Modus (synthetische Daten; keine Entität nötig)","editor.feature_tiles":"Feature-Kacheln","editor.group_entity":"Gruppen-Entität","editor.hide_status":"Status-Zelle ausblenden","editor.section.badges":"Badges","editor.section.deviations":"Abweichungen","editor.section.panel":"Panel","editor.status_cell":"Status-Zelle","editor.title":"Titel","editor.title_placeholder":"Entitätsname verwenden","feature.calibration":"Kalibrierung","feature.isolation":"Isolation","feature.presence":"Präsenz","feature.schedule":"Zeitplan","feature.sync":"Sync","feature.window":"Fenster","humidity.target":"Feuchte-Sollwert","member.unavailable":"Nicht verfügbar","mode.auto":"Automatik","mode.cool":"Kühlen","mode.dry":"Trocknen","mode.fan_only":"Nur Lüfter","mode.heat":"Heizen","mode.heat_cool":"Heizen/Kühlen","mode.off":"Aus","source.manual":"Manuell","source.mirror":"Spiegel","source.schedule":"Zeitplan","source.sync":"Sync","source.window":"Fenster","status.active":"Aktiv","status.blocking_for":"seit {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} Abweichung","status.hold":"Halten {minutes} min","status.isolated":"{count} isoliert","status.next":"Nächster {time}","status.no_deviations":"Keine Abweichungen","status.oob":"{count} außerhalb des Bereichs","tile.fan":"Lüftermodus","tile.mode":"Modus","tile.preset":"Preset","tile.swing":"Schwenkmodus","tile.swing_horizontal":"Horizontal schwenken"},es:{"action.cooling":"Enfriando","action.drying":"Deshumidificando","action.fan":"Ventilador","action.heating":"Calentando","action.idle":"Inactivo","action.off":"Apagado","block.presence":"Ausente","block.switch":"Interruptor principal apagado","block.window":"Ventana abierta","card.entity_not_found":"Entidad no encontrada: {entity}","card.more_info":"Más información","common.decrease":"Disminuir","common.humidity":"Humedad","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demostración","demo.room.bathroom":"Baño","demo.room.bedroom":"Dormitorio","demo.room.kitchen":"Cocina","demo.room.living_room":"Salón","demo.schedule":"Programación de demostración","demo.slot":"Franja de demostración","editor.demo":"Modo demo (datos sintéticos; no se necesita entidad)","editor.feature_tiles":"Tarjetas de funciones","editor.group_entity":"Entidad del grupo","editor.hide_status":"Ocultar la celda de estado","editor.section.badges":"Insignias","editor.section.deviations":"Desviaciones","editor.section.panel":"Panel","editor.status_cell":"Celda de estado","editor.title":"Título","editor.title_placeholder":"Usar el nombre de la entidad","feature.calibration":"Calibración","feature.isolation":"Aislamiento","feature.presence":"Presencia","feature.schedule":"Programación","feature.sync":"Sync","feature.window":"Ventana","humidity.target":"Humedad objetivo","member.unavailable":"No disponible","mode.auto":"Automático","mode.cool":"Frío","mode.dry":"Seco","mode.fan_only":"Solo ventilador","mode.heat":"Calor","mode.heat_cool":"Calor/Frío","mode.off":"Apagado","source.manual":"Manual","source.mirror":"Espejo","source.schedule":"Programación","source.sync":"Sync","source.window":"Ventana","status.active":"Activo","status.blocking_for":"desde hace {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergencia","status.hold":"Mantener {minutes} min","status.isolated":"{count} aislado","status.next":"Siguiente {time}","status.no_deviations":"Sin desviaciones","status.oob":"{count} fuera de rango","tile.fan":"Modo de ventilador","tile.mode":"Modo","tile.preset":"Preajuste","tile.swing":"Modo de oscilación","tile.swing_horizontal":"Oscilación horizontal"},fi:{"action.cooling":"Jäähdyttää","action.drying":"Kuivattaa","action.fan":"Puhallin","action.heating":"Lämmittää","action.idle":"Odottaa","action.off":"Pois","block.presence":"Poissa","block.switch":"Pääkytkin pois","block.window":"Ikkuna auki","card.entity_not_found":"Entiteettiä ei löytynyt: {entity}","card.more_info":"Lisätietoja","common.decrease":"Vähennä","common.humidity":"Kosteus","common.increase":"Lisää","common.temperature":"Lämpötila","demo.group":"Demoryhmä","demo.room.bathroom":"Kylpyhuone","demo.room.bedroom":"Makuuhuone","demo.room.kitchen":"Keittiö","demo.room.living_room":"Olohuone","demo.schedule":"Demoaikataulu","demo.slot":"Demojakso","editor.demo":"Esittelytila (synteettinen data; entiteettiä ei tarvita)","editor.feature_tiles":"Ominaisuusruudut","editor.group_entity":"Ryhmän entiteetti","editor.hide_status":"Piilota tilaruutu","editor.section.badges":"Merkit","editor.section.deviations":"Poikkeamat","editor.section.panel":"Paneeli","editor.status_cell":"Tilaruutu","editor.title":"Otsikko","editor.title_placeholder":"Käytä entiteetin nimeä","feature.calibration":"Kalibrointi","feature.isolation":"Eristys","feature.presence":"Läsnäolo","feature.schedule":"Aikataulu","feature.sync":"Sync","feature.window":"Ikkuna","humidity.target":"Kosteuden tavoite","member.unavailable":"Ei saatavilla","mode.auto":"Automaattinen","mode.cool":"Jäähdytys","mode.dry":"Kuivaus","mode.fan_only":"Vain puhallin","mode.heat":"Lämmitys","mode.heat_cool":"Lämmitys/Jäähdytys","mode.off":"Pois","source.manual":"Manuaalinen","source.mirror":"Peilaus","source.schedule":"Aikataulu","source.sync":"Sync","source.window":"Ikkuna","status.active":"Aktiivinen","status.blocking_for":"jo {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} poikkeama","status.hold":"Pito {minutes} min","status.isolated":"{count} eristetty","status.next":"Seuraava {time}","status.no_deviations":"Ei poikkeamia","status.oob":"{count} rajojen ulkopuolella","tile.fan":"Puhallintila","tile.mode":"Tila","tile.preset":"Esiasetus","tile.swing":"Kääntötila","tile.swing_horizontal":"Vaakakääntö"},fr:{"action.cooling":"Refroidissement","action.drying":"Déshumidification","action.fan":"Ventilation","action.heating":"Chauffage","action.idle":"Inactif","action.off":"Éteint","block.presence":"Absent","block.switch":"Interrupteur principal éteint","block.window":"Fenêtre ouverte","card.entity_not_found":"Entité introuvable : {entity}","card.more_info":"Plus d'infos","common.decrease":"Diminuer","common.humidity":"Humidité","common.increase":"Augmenter","common.temperature":"Température","demo.group":"Groupe de démo","demo.room.bathroom":"Salle de bain","demo.room.bedroom":"Chambre","demo.room.kitchen":"Cuisine","demo.room.living_room":"Salon","demo.schedule":"Planification de démo","demo.slot":"Créneau de démo","editor.demo":"Mode démo (données synthétiques ; aucune entité requise)","editor.feature_tiles":"Tuiles de fonctions","editor.group_entity":"Entité du groupe","editor.hide_status":"Masquer la cellule d'état","editor.section.badges":"Badges","editor.section.deviations":"Écarts","editor.section.panel":"Panneau","editor.status_cell":"Cellule d'état","editor.title":"Titre","editor.title_placeholder":"Utiliser le nom de l'entité","feature.calibration":"Calibration","feature.isolation":"Isolation","feature.presence":"Présence","feature.schedule":"Planification","feature.sync":"Sync","feature.window":"Fenêtre","humidity.target":"Humidité cible","member.unavailable":"Indisponible","mode.auto":"Automatique","mode.cool":"Froid","mode.dry":"Sec","mode.fan_only":"Ventilation seule","mode.heat":"Chauffage","mode.heat_cool":"Chauffage/Froid","mode.off":"Éteint","source.manual":"Manuel","source.mirror":"Miroir","source.schedule":"Planification","source.sync":"Sync","source.window":"Fenêtre","status.active":"Actif","status.blocking_for":"depuis {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} écart","status.hold":"Maintien {minutes} min","status.isolated":"{count} isolé","status.next":"Prochain {time}","status.no_deviations":"Aucun écart","status.oob":"{count} hors limites","tile.fan":"Mode ventilation","tile.mode":"Mode","tile.preset":"Préréglage","tile.swing":"Mode oscillation","tile.swing_horizontal":"Oscillation horizontale"},it:{"action.cooling":"Raffreddamento","action.drying":"Deumidificazione","action.fan":"Ventola","action.heating":"Riscaldamento","action.idle":"Inattivo","action.off":"Spento","block.presence":"Assente","block.switch":"Interruttore principale spento","block.window":"Finestra aperta","card.entity_not_found":"Entità non trovata: {entity}","card.more_info":"Altre info","common.decrease":"Diminuisci","common.humidity":"Umidità","common.increase":"Aumenta","common.temperature":"Temperatura","demo.group":"Gruppo demo","demo.room.bathroom":"Bagno","demo.room.bedroom":"Camera da letto","demo.room.kitchen":"Cucina","demo.room.living_room":"Soggiorno","demo.schedule":"Pianificazione demo","demo.slot":"Fascia demo","editor.demo":"Modalità demo (dati sintetici; nessuna entità necessaria)","editor.feature_tiles":"Riquadri funzioni","editor.group_entity":"Entità del gruppo","editor.hide_status":"Nascondi la cella di stato","editor.section.badges":"Badge","editor.section.deviations":"Scostamenti","editor.section.panel":"Pannello","editor.status_cell":"Cella di stato","editor.title":"Titolo","editor.title_placeholder":"Usa il nome dell'entità","feature.calibration":"Calibrazione","feature.isolation":"Isolamento","feature.presence":"Presenza","feature.schedule":"Pianificazione","feature.sync":"Sync","feature.window":"Finestra","humidity.target":"Umidità target","member.unavailable":"Non disponibile","mode.auto":"Automatico","mode.cool":"Raffreddamento","mode.dry":"Deumidificazione","mode.fan_only":"Solo ventola","mode.heat":"Riscaldamento","mode.heat_cool":"Riscaldamento/Raffreddamento","mode.off":"Spento","source.manual":"Manuale","source.mirror":"Mirror","source.schedule":"Pianificazione","source.sync":"Sync","source.window":"Finestra","status.active":"Attivo","status.blocking_for":"da {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} scostamento","status.hold":"Mantieni {minutes} min","status.isolated":"{count} isolato","status.next":"Prossimo {time}","status.no_deviations":"Nessuno scostamento","status.oob":"{count} fuori intervallo","tile.fan":"Modalità ventola","tile.mode":"Modalità","tile.preset":"Preset","tile.swing":"Modalità oscillazione","tile.swing_horizontal":"Oscillazione orizzontale"},nb:{"action.cooling":"Kjøler","action.drying":"Avfukter","action.fan":"Vifte","action.heating":"Varmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borte","block.switch":"Hovedbryter av","block.window":"Vindu åpent","card.entity_not_found":"Enhet ikke funnet: {entity}","card.more_info":"Mer info","common.decrease":"Reduser","common.humidity":"Luftfuktighet","common.increase":"Øk","common.temperature":"Temperatur","demo.group":"Demogruppe","demo.room.bathroom":"Bad","demo.room.bedroom":"Soverom","demo.room.kitchen":"Kjøkken","demo.room.living_room":"Stue","demo.schedule":"Demotidsplan","demo.slot":"Demotidsrom","editor.demo":"Demomodus (syntetiske data; ingen enhet nødvendig)","editor.feature_tiles":"Funksjonsfliser","editor.group_entity":"Gruppeenhet","editor.hide_status":"Skjul statusfeltet","editor.section.badges":"Merker","editor.section.deviations":"Avvik","editor.section.panel":"Panel","editor.status_cell":"Statusfelt","editor.title":"Tittel","editor.title_placeholder":"Bruk enhetsnavnet","feature.calibration":"Kalibrering","feature.isolation":"Isolering","feature.presence":"Tilstedeværelse","feature.schedule":"Tidsplan","feature.sync":"Sync","feature.window":"Vindu","humidity.target":"Ønsket luftfuktighet","member.unavailable":"Utilgjengelig","mode.auto":"Automatisk","mode.cool":"Kjøling","mode.dry":"Avfukting","mode.fan_only":"Kun vifte","mode.heat":"Varme","mode.heat_cool":"Varme/Kjøling","mode.off":"Av","source.manual":"Manuell","source.mirror":"Speiling","source.schedule":"Tidsplan","source.sync":"Sync","source.window":"Vindu","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} avvik","status.hold":"Hold {minutes} min","status.isolated":"{count} isolert","status.next":"Neste {time}","status.no_deviations":"Ingen avvik","status.oob":"{count} utenfor området","tile.fan":"Viftemodus","tile.mode":"Modus","tile.preset":"Forhåndsinnstilling","tile.swing":"Svingmodus","tile.swing_horizontal":"Horisontal sving"},nl:{"action.cooling":"Koelen","action.drying":"Ontvochtigen","action.fan":"Ventilator","action.heating":"Verwarmen","action.idle":"Inactief","action.off":"Uit","block.presence":"Afwezig","block.switch":"Hoofdschakelaar uit","block.window":"Raam open","card.entity_not_found":"Entiteit niet gevonden: {entity}","card.more_info":"Meer info","common.decrease":"Verlagen","common.humidity":"Luchtvochtigheid","common.increase":"Verhogen","common.temperature":"Temperatuur","demo.group":"Demogroep","demo.room.bathroom":"Badkamer","demo.room.bedroom":"Slaapkamer","demo.room.kitchen":"Keuken","demo.room.living_room":"Woonkamer","demo.schedule":"Demoschema","demo.slot":"Demoblok","editor.demo":"Demomodus (synthetische gegevens; geen entiteit nodig)","editor.feature_tiles":"Functietegels","editor.group_entity":"Groepsentiteit","editor.hide_status":"Statuscel verbergen","editor.section.badges":"Badges","editor.section.deviations":"Afwijkingen","editor.section.panel":"Paneel","editor.status_cell":"Statuscel","editor.title":"Titel","editor.title_placeholder":"Entiteitsnaam gebruiken","feature.calibration":"Kalibratie","feature.isolation":"Isolatie","feature.presence":"Aanwezigheid","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Raam","humidity.target":"Gewenste luchtvochtigheid","member.unavailable":"Niet beschikbaar","mode.auto":"Automatisch","mode.cool":"Koelen","mode.dry":"Drogen","mode.fan_only":"Alleen ventilator","mode.heat":"Verwarmen","mode.heat_cool":"Verwarmen/Koelen","mode.off":"Uit","source.manual":"Handmatig","source.mirror":"Spiegel","source.schedule":"Schema","source.sync":"Sync","source.window":"Raam","status.active":"Actief","status.blocking_for":"al {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} afwijking","status.hold":"Vasthouden {minutes} min","status.isolated":"{count} geïsoleerd","status.next":"Volgende {time}","status.no_deviations":"Geen afwijkingen","status.oob":"{count} buiten bereik","tile.fan":"Ventilatormodus","tile.mode":"Modus","tile.preset":"Voorinstelling","tile.swing":"Zwenkmodus","tile.swing_horizontal":"Horizontaal zwenken"},pl:{"action.cooling":"Chłodzenie","action.drying":"Osuszanie","action.fan":"Wentylator","action.heating":"Ogrzewanie","action.idle":"Bezczynny","action.off":"Wyłączony","block.presence":"Nieobecny","block.switch":"Wyłącznik główny wyłączony","block.window":"Okno otwarte","card.entity_not_found":"Nie znaleziono encji: {entity}","card.more_info":"Więcej informacji","common.decrease":"Zmniejsz","common.humidity":"Wilgotność","common.increase":"Zwiększ","common.temperature":"Temperatura","demo.group":"Grupa demonstracyjna","demo.room.bathroom":"Łazienka","demo.room.bedroom":"Sypialnia","demo.room.kitchen":"Kuchnia","demo.room.living_room":"Salon","demo.schedule":"Harmonogram demonstracyjny","demo.slot":"Przedział demonstracyjny","editor.demo":"Tryb demo (dane syntetyczne; encja nie jest potrzebna)","editor.feature_tiles":"Kafelki funkcji","editor.group_entity":"Encja grupy","editor.hide_status":"Ukryj komórkę stanu","editor.section.badges":"Odznaki","editor.section.deviations":"Odchylenia","editor.section.panel":"Panel","editor.status_cell":"Komórka stanu","editor.title":"Tytuł","editor.title_placeholder":"Użyj nazwy encji","feature.calibration":"Kalibracja","feature.isolation":"Izolacja","feature.presence":"Obecność","feature.schedule":"Harmonogram","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Docelowa wilgotność","member.unavailable":"Niedostępny","mode.auto":"Automatyczny","mode.cool":"Chłodzenie","mode.dry":"Osuszanie","mode.fan_only":"Tylko wentylator","mode.heat":"Ogrzewanie","mode.heat_cool":"Ogrzewanie/Chłodzenie","mode.off":"Wyłączony","source.manual":"Ręcznie","source.mirror":"Lustro","source.schedule":"Harmonogram","source.sync":"Sync","source.window":"Okno","status.active":"Aktywny","status.blocking_for":"od {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchylenie","status.hold":"Wstrzymanie {minutes} min","status.isolated":"{count} izolowanych","status.next":"Następny {time}","status.no_deviations":"Brak odchyleń","status.oob":"{count} poza zakresem","tile.fan":"Tryb wentylatora","tile.mode":"Tryb","tile.preset":"Ustawienie wstępne","tile.swing":"Tryb wahania","tile.swing_horizontal":"Wahanie poziome"},pt:{"action.cooling":"A arrefecer","action.drying":"A desumidificar","action.fan":"Ventilação","action.heating":"A aquecer","action.idle":"Inativo","action.off":"Desligado","block.presence":"Ausente","block.switch":"Interruptor principal desligado","block.window":"Janela aberta","card.entity_not_found":"Entidade não encontrada: {entity}","card.more_info":"Mais informações","common.decrease":"Diminuir","common.humidity":"Humidade","common.increase":"Aumentar","common.temperature":"Temperatura","demo.group":"Grupo de demonstração","demo.room.bathroom":"Casa de banho","demo.room.bedroom":"Quarto","demo.room.kitchen":"Cozinha","demo.room.living_room":"Sala de estar","demo.schedule":"Agendamento de demonstração","demo.slot":"Intervalo de demonstração","editor.demo":"Modo demo (dados sintéticos; não é necessária uma entidade)","editor.feature_tiles":"Mosaicos de funções","editor.group_entity":"Entidade do grupo","editor.hide_status":"Ocultar a célula de estado","editor.section.badges":"Emblemas","editor.section.deviations":"Desvios","editor.section.panel":"Painel","editor.status_cell":"Célula de estado","editor.title":"Título","editor.title_placeholder":"Usar o nome da entidade","feature.calibration":"Calibração","feature.isolation":"Isolamento","feature.presence":"Presença","feature.schedule":"Agendamento","feature.sync":"Sync","feature.window":"Janela","humidity.target":"Humidade alvo","member.unavailable":"Indisponível","mode.auto":"Automático","mode.cool":"Arrefecimento","mode.dry":"Desumidificação","mode.fan_only":"Apenas ventilação","mode.heat":"Aquecimento","mode.heat_cool":"Aquecimento/Arrefecimento","mode.off":"Desligado","source.manual":"Manual","source.mirror":"Espelho","source.schedule":"Agendamento","source.sync":"Sync","source.window":"Janela","status.active":"Ativo","status.blocking_for":"há {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} divergência","status.hold":"Manter {minutes} min","status.isolated":"{count} isolado","status.next":"Seguinte {time}","status.no_deviations":"Sem desvios","status.oob":"{count} fora do intervalo","tile.fan":"Modo de ventilação","tile.mode":"Modo","tile.preset":"Predefinição","tile.swing":"Modo de oscilação","tile.swing_horizontal":"Oscilação horizontal"},sk:{"action.cooling":"Chladenie","action.drying":"Odvlhčovanie","action.fan":"Ventilátor","action.heating":"Kúrenie","action.idle":"Nečinný","action.off":"Vypnuté","block.presence":"Neprítomný","block.switch":"Hlavný vypínač vypnutý","block.window":"Okno otvorené","card.entity_not_found":"Entita sa nenašla: {entity}","card.more_info":"Viac informácií","common.decrease":"Znížiť","common.humidity":"Vlhkosť","common.increase":"Zvýšiť","common.temperature":"Teplota","demo.group":"Demo skupina","demo.room.bathroom":"Kúpeľňa","demo.room.bedroom":"Spálňa","demo.room.kitchen":"Kuchyňa","demo.room.living_room":"Obývačka","demo.schedule":"Demo plán","demo.slot":"Demo úsek","editor.demo":"Režim ukážky (syntetické údaje; entita nie je potrebná)","editor.feature_tiles":"Dlaždice funkcií","editor.group_entity":"Entita skupiny","editor.hide_status":"Skryť stavovú bunku","editor.section.badges":"Odznaky","editor.section.deviations":"Odchýlky","editor.section.panel":"Panel","editor.status_cell":"Stavová bunka","editor.title":"Názov","editor.title_placeholder":"Použiť názov entity","feature.calibration":"Kalibrácia","feature.isolation":"Izolácia","feature.presence":"Prítomnosť","feature.schedule":"Plán","feature.sync":"Sync","feature.window":"Okno","humidity.target":"Cieľová vlhkosť","member.unavailable":"Nedostupné","mode.auto":"Automaticky","mode.cool":"Chladenie","mode.dry":"Odvlhčovanie","mode.fan_only":"Iba ventilátor","mode.heat":"Kúrenie","mode.heat_cool":"Kúrenie/Chladenie","mode.off":"Vypnuté","source.manual":"Ručne","source.mirror":"Zrkadlenie","source.schedule":"Plán","source.sync":"Sync","source.window":"Okno","status.active":"Aktívny","status.blocking_for":"už {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} odchýlka","status.hold":"Podržať {minutes} min","status.isolated":"{count} izolovaných","status.next":"Ďalší {time}","status.no_deviations":"Žiadne odchýlky","status.oob":"{count} mimo rozsahu","tile.fan":"Režim ventilátora","tile.mode":"Režim","tile.preset":"Predvoľba","tile.swing":"Režim natáčania","tile.swing_horizontal":"Vodorovné natáčanie"},sv:{"action.cooling":"Kyler","action.drying":"Avfuktar","action.fan":"Fläkt","action.heating":"Värmer","action.idle":"Inaktiv","action.off":"Av","block.presence":"Borta","block.switch":"Huvudbrytare av","block.window":"Fönster öppet","card.entity_not_found":"Entitet hittades inte: {entity}","card.more_info":"Mer info","common.decrease":"Minska","common.humidity":"Luftfuktighet","common.increase":"Öka","common.temperature":"Temperatur","demo.group":"Demogrupp","demo.room.bathroom":"Badrum","demo.room.bedroom":"Sovrum","demo.room.kitchen":"Kök","demo.room.living_room":"Vardagsrum","demo.schedule":"Demoschema","demo.slot":"Demopass","editor.demo":"Demoläge (syntetiska data; ingen entitet behövs)","editor.feature_tiles":"Funktionsrutor","editor.group_entity":"Gruppentitet","editor.hide_status":"Dölj statusrutan","editor.section.badges":"Märken","editor.section.deviations":"Avvikelser","editor.section.panel":"Panel","editor.status_cell":"Statusruta","editor.title":"Titel","editor.title_placeholder":"Använd entitetens namn","feature.calibration":"Kalibrering","feature.isolation":"Isolering","feature.presence":"Närvaro","feature.schedule":"Schema","feature.sync":"Sync","feature.window":"Fönster","humidity.target":"Önskad luftfuktighet","member.unavailable":"Otillgänglig","mode.auto":"Automatiskt","mode.cool":"Kyla","mode.dry":"Avfuktning","mode.fan_only":"Endast fläkt","mode.heat":"Värme","mode.heat_cool":"Värme/Kyla","mode.off":"Av","source.manual":"Manuell","source.mirror":"Spegling","source.schedule":"Schema","source.sync":"Sync","source.window":"Fönster","status.active":"Aktiv","status.blocking_for":"i {duration}","status.boost":"Boost {minutes} min","status.divergence":"{count} avvikelse","status.hold":"Håll {minutes} min","status.isolated":"{count} isolerad","status.next":"Nästa {time}","status.no_deviations":"Inga avvikelser","status.oob":"{count} utanför intervallet","tile.fan":"Fläktläge","tile.mode":"Läge","tile.preset":"Förinställning","tile.swing":"Svängläge","tile.swing_horizontal":"Horisontell sväng"},tr:{"action.cooling":"Soğutuyor","action.drying":"Nem alıyor","action.fan":"Fan","action.heating":"Isıtıyor","action.idle":"Boşta","action.off":"Kapalı","block.presence":"Dışarıda","block.switch":"Ana şalter kapalı","block.window":"Pencere açık","card.entity_not_found":"Varlık bulunamadı: {entity}","card.more_info":"Daha fazla bilgi","common.decrease":"Azalt","common.humidity":"Nem","common.increase":"Artır","common.temperature":"Sıcaklık","demo.group":"Demo grubu","demo.room.bathroom":"Banyo","demo.room.bedroom":"Yatak odası","demo.room.kitchen":"Mutfak","demo.room.living_room":"Oturma odası","demo.schedule":"Demo zamanlaması","demo.slot":"Demo zaman dilimi","editor.demo":"Demo modu (sentetik veri; varlık gerekmez)","editor.feature_tiles":"Özellik kutuları","editor.group_entity":"Grup varlığı","editor.hide_status":"Durum hücresini gizle","editor.section.badges":"Rozetler","editor.section.deviations":"Sapmalar","editor.section.panel":"Panel","editor.status_cell":"Durum hücresi","editor.title":"Başlık","editor.title_placeholder":"Varlık adını kullan","feature.calibration":"Kalibrasyon","feature.isolation":"İzolasyon","feature.presence":"Varlık algılama","feature.schedule":"Zamanlama","feature.sync":"Sync","feature.window":"Pencere","humidity.target":"Hedef nem","member.unavailable":"Kullanılamıyor","mode.auto":"Otomatik","mode.cool":"Soğutma","mode.dry":"Nem alma","mode.fan_only":"Yalnızca fan","mode.heat":"Isıtma","mode.heat_cool":"Isıtma/Soğutma","mode.off":"Kapalı","source.manual":"Manuel","source.mirror":"Yansıtma","source.schedule":"Zamanlama","source.sync":"Sync","source.window":"Pencere","status.active":"Etkin","status.blocking_for":"{duration} beri","status.boost":"Boost {minutes} dk","status.divergence":"{count} sapma","status.hold":"Beklet {minutes} dk","status.isolated":"{count} izole","status.next":"Sonraki {time}","status.no_deviations":"Sapma yok","status.oob":"{count} aralık dışında","tile.fan":"Fan modu","tile.mode":"Mod","tile.preset":"Ön ayar","tile.swing":"Salınım modu","tile.swing_horizontal":"Yatay salınım"},uk:{"action.cooling":"Охолодження","action.drying":"Осушення","action.fan":"Вентилятор","action.heating":"Нагрівання","action.idle":"Очікування","action.off":"Вимкнено","block.presence":"Відсутній","block.switch":"Головний вимикач вимкнено","block.window":"Вікно відкрите","card.entity_not_found":"Сутність не знайдено: {entity}","card.more_info":"Докладніше","common.decrease":"Зменшити","common.humidity":"Вологість","common.increase":"Збільшити","common.temperature":"Температура","demo.group":"Демо-група","demo.room.bathroom":"Ванна кімната","demo.room.bedroom":"Спальня","demo.room.kitchen":"Кухня","demo.room.living_room":"Вітальня","demo.schedule":"Демо-розклад","demo.slot":"Демо-інтервал","editor.demo":"Демо-режим (синтетичні дані; сутність не потрібна)","editor.feature_tiles":"Плитки функцій","editor.group_entity":"Сутність групи","editor.hide_status":"Приховати комірку стану","editor.section.badges":"Значки","editor.section.deviations":"Відхилення","editor.section.panel":"Панель","editor.status_cell":"Комірка стану","editor.title":"Заголовок","editor.title_placeholder":"Використати назву сутності","feature.calibration":"Калібрування","feature.isolation":"Ізоляція","feature.presence":"Присутність","feature.schedule":"Розклад","feature.sync":"Sync","feature.window":"Вікно","humidity.target":"Цільова вологість","member.unavailable":"Недоступно","mode.auto":"Автоматично","mode.cool":"Охолодження","mode.dry":"Осушення","mode.fan_only":"Лише вентилятор","mode.heat":"Нагрівання","mode.heat_cool":"Нагрівання/Охолодження","mode.off":"Вимкнено","source.manual":"Вручну","source.mirror":"Дзеркало","source.schedule":"Розклад","source.sync":"Sync","source.window":"Вікно","status.active":"Активно","status.blocking_for":"уже {duration}","status.boost":"Boost {minutes} хв","status.divergence":"{count} відхилення","status.hold":"Утримання {minutes} хв","status.isolated":"{count} ізольовано","status.next":"Наступний {time}","status.no_deviations":"Немає відхилень","status.oob":"{count} поза межами","tile.fan":"Режим вентилятора","tile.mode":"Режим","tile.preset":"Пресет","tile.swing":"Режим коливання","tile.swing_horizontal":"Горизонтальне коливання"},zh:{"action.cooling":"制冷中","action.drying":"除湿中","action.fan":"送风","action.heating":"制热中","action.idle":"空闲","action.off":"关闭","block.presence":"离开","block.switch":"主开关已关闭","block.window":"窗户已打开","card.entity_not_found":"未找到实体：{entity}","card.more_info":"更多信息","common.decrease":"降低","common.humidity":"湿度","common.increase":"升高","common.temperature":"温度","demo.group":"演示组","demo.room.bathroom":"浴室","demo.room.bedroom":"卧室","demo.room.kitchen":"厨房","demo.room.living_room":"客厅","demo.schedule":"演示计划","demo.slot":"演示时段","editor.demo":"演示模式（合成数据；无需实体）","editor.feature_tiles":"功能磁贴","editor.group_entity":"群组实体","editor.hide_status":"隐藏状态区","editor.section.badges":"徽章","editor.section.deviations":"偏差","editor.section.panel":"面板","editor.status_cell":"状态区","editor.title":"标题","editor.title_placeholder":"使用实体名称","feature.calibration":"校准","feature.isolation":"隔离","feature.presence":"人员在场","feature.schedule":"计划","feature.sync":"同步","feature.window":"窗户","humidity.target":"目标湿度","member.unavailable":"不可用","mode.auto":"自动","mode.cool":"制冷","mode.dry":"除湿","mode.fan_only":"仅送风","mode.heat":"制热","mode.heat_cool":"制热/制冷","mode.off":"关闭","source.manual":"手动","source.mirror":"镜像","source.schedule":"计划","source.sync":"同步","source.window":"窗户","status.active":"活动中","status.blocking_for":"已 {duration}","status.boost":"Boost {minutes} 分钟","status.divergence":"{count} 处分歧","status.hold":"保持 {minutes} 分钟","status.isolated":"{count} 个已隔离","status.next":"下一个 {time}","status.no_deviations":"无偏差","status.oob":"{count} 个超出范围","tile.fan":"风速模式","tile.mode":"模式","tile.preset":"预设","tile.swing":"摆风模式","tile.swing_horizontal":"水平摆风"}},ui=t=>(t??"en").split("-")[0].toLowerCase(),ot=(t,e,o)=>{const s=(Oe[ui(t)]??Oe.en)[e]??Oe.en[e]??e;return o?s.replace(/\{(\w+)\}/g,(n,a)=>a in o?String(o[a]):n):s},it=(t,e,o)=>{var n;if(!o)return"";const i=`${e}.${o}`,s=((n=t==null?void 0:t.locale)==null?void 0:n.language)??(t==null?void 0:t.language);return i in Oe.en?ot(s,i):o};function H(t){return class extends t{t(e,o){var s,n,a;const i=((n=(s=this.hass)==null?void 0:s.locale)==null?void 0:n.language)??((a=this.hass)==null?void 0:a.language);return ot(i,e,o)}}}var hi=Object.defineProperty,mi=Object.getOwnPropertyDescriptor,Le=(t,e,o,i)=>{for(var s=i>1?void 0:i?mi(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&hi(e,o,s),s};let X=class extends H($){constructor(){super(...arguments),this.disabled=!1}get _outlineStyle(){return this.color?Me({"--cgh-btn-outline":this.color}):c}_emit(t){this.dispatchEvent(new CustomEvent("cgh-step",{detail:{direction:t},bubbles:!0,composed:!0}))}render(){return d`
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
    `}};X.styles=k`
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
        var(--cgh-btn-outline, var(--md-sys-color-outline, var(--secondary-text-color)));
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
  `,Le([p({attribute:!1})],X.prototype,"hass",2),Le([p({type:Boolean})],X.prototype,"disabled",2),Le([p()],X.prototype,"color",2),X=Le([E("cgh-number-buttons")],X);const ge=t=>{const e=t==null?void 0:t.locale;if(!e)return t==null?void 0:t.language;switch(e.number_format){case"comma_decimal":return["en-US","en"];case"decimal_comma":return["de","es","it"];case"space_comma":return["fr","sv","cs"];case"quote_decimal":return["de-CH"];case"system":return;default:return e.language}},pi=(t,e,o)=>{var r,u;const i=t instanceof Date?t:new Date(t),s=(r=e==null?void 0:e.locale)==null?void 0:r.time_format,n=((u=e==null?void 0:e.locale)==null?void 0:u.language)??(e==null?void 0:e.language),a=s==="system"?void 0:n,l=s==="12"||(s==="language"||s==="system"||!s)&&new Date("January 1, 2026 22:00:00").toLocaleString(a).includes("10");try{return new Intl.DateTimeFormat(s==="system"?void 0:n,{hourCycle:l?"h12":"h23",...o}).format(i)}catch{return i.toLocaleTimeString()}},fi=(t,e)=>{var s;const o=t<60?"minute":t<1440?"hour":"day",i=o==="minute"?t:o==="hour"?t/60:t/1440;return new Intl.NumberFormat(((s=e==null?void 0:e.locale)==null?void 0:s.language)??(e==null?void 0:e.language),{style:"unit",unit:o,unitDisplay:"short"}).format(Math.max(1,Math.floor(i)))},gi=(t,e)=>{var l,r;if(!t)return;const o=((r=(l=e==null?void 0:e.config)==null?void 0:l.unit_system)==null?void 0:r.temperature)??"°C",i=u=>new Intl.NumberFormat(ge(e),{maximumFractionDigits:1}).format(u),s=t.target_temp_low,n=t.target_temp_high;if(s!=null&&n!=null)return`${i(s)}–${i(n)} ${o}`;const a=t.temperature;return a!=null?`${i(a)} ${o}`:void 0},Gt=(t,e=Date.now())=>{if(typeof t!="string")return null;const o=new Date(t).getTime()-e;return o>0?Math.ceil(o/6e4):null};var _i="M18 16H14V18H18V20L21 17L18 14V16M11 4C8.8 4 7 5.8 7 8S8.8 12 11 12 15 10.2 15 8 13.2 4 11 4M11 14C6.6 14 3 15.8 3 18V20H12.5C12.2 19.2 12 18.4 12 17.5C12 16.3 12.3 15.2 12.9 14.1C12.3 14.1 11.7 14 11 14",vi="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16",bi="M6 14H9L5 18L1 14H4C4 11.3 5.7 6.6 11 6.1V8.1C7.6 8.6 6 11.9 6 14M20 14C20 11.3 18.3 6.6 13 6.1V8.1C16.4 8.7 18 11.9 18 14H15L19 18L23 14H20Z",yi="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z",wi="M14,4L16.29,6.29L13.41,9.17L14.83,10.59L17.71,7.71L20,10V4M10,4H4V10L6.29,7.71L11,12.41V20H13V11.59L7.71,6.29",$i="M12 8L15 13.2L18 10.5L17.3 14H6.7L6 10.5L9 13.2L12 8M12 4L8.5 10L3 5L5 16H19L21 5L15.5 10L12 4M19 18H5V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V18Z",xi="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",ki="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",Ai="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z",Ci="M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z",Ei="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",Si="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13",Mi="M13.13 22.19L11.5 18.36C13.07 17.78 14.54 17 15.9 16.09L13.13 22.19M5.64 12.5L1.81 10.87L7.91 8.1C7 9.46 6.22 10.93 5.64 12.5M21.61 2.39C21.61 2.39 16.66 .269 11 5.93C8.81 8.12 7.5 10.53 6.65 12.64C6.37 13.39 6.56 14.21 7.11 14.77L9.24 16.89C9.79 17.45 10.61 17.63 11.36 17.35C13.5 16.53 15.88 15.19 18.07 13C23.73 7.34 21.61 2.39 21.61 2.39M14.54 9.46C13.76 8.68 13.76 7.41 14.54 6.63S16.59 5.85 17.37 6.63C18.14 7.41 18.15 8.68 17.37 9.46C16.59 10.24 15.32 10.24 14.54 9.46M8.88 16.53L7.47 15.12L8.88 16.53M6.24 22L9.88 18.36C9.54 18.27 9.21 18.12 8.91 17.91L4.83 22H6.24M2 22H3.41L8.18 17.24L6.76 15.83L2 20.59V22M2 19.17L6.09 15.09C5.88 14.79 5.73 14.47 5.64 14.12L2 17.76V19.17Z",Oi="M20.79,13.95L18.46,14.57L16.46,13.44V10.56L18.46,9.43L20.79,10.05L21.31,8.12L19.54,7.65L20,5.88L18.07,5.36L17.45,7.69L15.45,8.82L13,7.38V5.12L14.71,3.41L13.29,2L12,3.29L10.71,2L9.29,3.41L11,5.12V7.38L8.5,8.82L6.5,7.69L5.92,5.36L4,5.88L4.47,7.65L2.7,8.12L3.22,10.05L5.55,9.43L7.55,10.56V13.45L5.55,14.58L3.22,13.96L2.7,15.89L4.47,16.36L4,18.12L5.93,18.64L6.55,16.31L8.55,15.18L11,16.62V18.88L9.29,20.59L10.71,22L12,20.71L13.29,22L14.7,20.59L13,18.88V16.62L15.5,15.17L17.5,16.3L18.12,18.63L20,18.12L19.53,16.35L21.3,15.88L20.79,13.95M9.5,10.56L12,9.11L14.5,10.56V13.44L12,14.89L9.5,13.44V10.56Z",Li="M12.92 1.58L11.18 2.58L12.39 4.67L11.8 6.85L9 7.6L7.38 6L7.42 3.59L5.43 3.59L5.43 5.42L3.59 5.42L3.6 7.42L6 7.42L7.65 9.03L6.9 11.82L4.68 12.4L2.59 11.2L1.59 12.93L3.17 13.84L2.26 15.42L4 16.42L5.19 14.33L7.42 13.75L7.92 14.26L9.32 12.86L8.78 12.32L9.53 9.54L12.32 8.78L12.85 9.32L14.26 7.91L13.73 7.37L14.32 5.19L16.41 4L15.41 2.25L13.83 3.16L12.92 1.58M20.72 4L4 20.72L5.27 22L10.16 17.11C10.63 17.43 11.15 17.68 11.71 17.83C14.38 18.55 17.12 16.96 17.83 14.29C18.22 12.86 17.93 11.36 17.11 10.16L22 5.27L20.72 4M18.74 9C19.18 9.63 19.53 10.38 19.75 11.19C19.97 12 20.03 12.81 19.96 13.61L22.65 10.41L18.74 9M19.32 15.95C19 16.67 18.5 17.35 17.93 17.94C17.34 18.53 16.66 19 15.96 19.34L20.05 20.06L19.32 15.95M9 18.71L10.41 22.66L13.59 19.95C12.81 20 12 19.97 11.19 19.76C10.36 19.54 9.62 19.17 9 18.71Z",Ti="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z",Pi="M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",Di="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22C12.4 22 12.7 22 13.1 21.9L15.4 15.3L14.8 14.7C15.5 14 16 13 16 11.9C16 11.2 15.8 10.5 15.4 9.9L17.6 7.7C18.5 9 19 10.4 19 12H20C20.3 12 20.6 12.1 20.8 12.2C20.8 12.2 20.9 12.2 20.9 12.3C21.3 12.5 21.7 12.9 21.9 13.4C22 12.9 22 12.5 22 12C22 6.5 17.5 2 12 2M14 8.6C13.4 8.2 12.7 8 12 8C9.8 8 8 9.8 8 12C8 13.1 8.4 14.1 9.2 14.8L7.1 16.9C5.8 15.7 5 13.9 5 12C5 8.1 8.1 5 12 5C13.6 5 15 5.5 16.2 6.4L14 8.6M20 14H18L14.8 23H16.7L17.4 21H20.6L21.3 23H23.2L20 14M17.8 19.7L19 16L20.2 19.7H17.8Z",Hi="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z",Vi="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z",zi="M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z",ji="M21 20V2H3V20H1V23H23V20M19 4V11H17V4M5 4H7V11H5M5 20V13H7V20M9 20V4H15V20M17 20V13H19V20Z";const st=Pi,Te=zi,Ii=xi,Ri=Ai,Ni=Oi,Zt=Si,qt=ki,Ui=Li,Ki=Di,Yt=Vi,Jt=bi,nt=ji,Xt=_i,Bi=Mi,Fi=Hi,at=Ei,Qt=vi,Wi=$i,rt=yi,lt=Ti,eo=Ci,Gi=wi,to=t=>{switch(t){case"cool":return Ni;case"dry":return Te;case"fan_only":return qt;case"auto":return Ki;case"heat":return Ri;case"off":return Zt;case"heat_cool":return Ui;default:return st}},Zi=1e4;class oo{constructor(e){this.host=e,this._values={},e.addController(this)}get(e){return this._values[e]}set(e){this._values={...this._values,...e},clearTimeout(this._timer),this._timer=setTimeout(()=>this.clear(),Zi),this.host.requestUpdate()}sync(e,o){for(const i of Object.keys(this._values))((e==null?void 0:e.entity_id)!==(o==null?void 0:o.entity_id)||(e==null?void 0:e.attributes[i])!==(o==null?void 0:o.attributes[i]))&&delete this._values[i]}clear(){clearTimeout(this._timer),this._timer=void 0,this._values={},this.host.requestUpdate()}hostDisconnected(){this.clear()}}var qi=Object.defineProperty,Yi=Object.getOwnPropertyDescriptor,Pe=(t,e,o,i)=>{for(var s=i>1?void 0:i?Yi(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&qi(e,o,s),s};const Ji=1,Xi=2;let Q=class extends ${constructor(){super(...arguments),this._bound="low",this._pending=new oo(this)}willUpdate(t){t.has("stateObj")&&this._pending.sync(t.get("stateObj"),this.stateObj)}_target(t){var e;return this._pending.get(t)??((e=this.stateObj)==null?void 0:e.attributes[t])}get _min(){var t;return((t=this.stateObj)==null?void 0:t.attributes.min_temp)??5}get _max(){var t;return((t=this.stateObj)==null?void 0:t.attributes.max_temp)??35}get _features(){var t;return((t=this.stateObj)==null?void 0:t.attributes.supported_features)??0}get _supportsTemperature(){var t;return(this._features&Ji)!==0&&((t=this.stateObj)==null?void 0:t.attributes.temperature)!=null}get _supportsRange(){var t,e;return(this._features&Xi)!==0&&((t=this.stateObj)==null?void 0:t.attributes.target_temp_low)!=null&&((e=this.stateObj)==null?void 0:e.attributes.target_temp_high)!=null}get _step(){var t;return((t=this.stateObj)==null?void 0:t.attributes.target_temp_step)??.5}get _digits(){var t;return((t=this._step.toString().split(".")[1])==null?void 0:t.length)??0}get _unit(){var t,e,o,i;return((o=(e=(t=this.hass)==null?void 0:t.config)==null?void 0:e.unit_system)==null?void 0:o.temperature)??((i=this.stateObj)==null?void 0:i.attributes.unit_of_measurement)??""}get _mode(){var i,s;const t=(i=this.stateObj)==null?void 0:i.state,e=(((s=this.stateObj)==null?void 0:s.attributes.hvac_modes)??[]).filter(n=>n==="heat"||n==="cool"||n==="heat_cool"),o=e.length===1&&(t==="auto"||t==="off")?e[0]:t;return o==="heat"?"start":o==="cool"?"end":"full"}get _inactive(){var e;const t=(e=this.stateObj)==null?void 0:e.state;return t==="off"||t==="unavailable"||t==="unknown"}_stateColor(){var t;switch((t=this.stateObj)==null?void 0:t.state){case"heat":return"var(--state-climate-heat-color, #ff5722)";case"cool":return"var(--state-climate-cool-color, #2196f3)";case"heat_cool":return"var(--state-climate-heat-cool-color, var(--state-climate-heat-color, #ffb300))";case"auto":return"var(--state-climate-auto-color, #4caf50)";case"dry":return"var(--state-climate-dry-color, #ff9800)";case"fan_only":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-inactive-color, var(--disabled-color, #9e9e9e))"}}_actionColor(){var e;const t=(e=this.stateObj)==null?void 0:e.attributes.hvac_action;if(!(!t||t==="idle"||t==="off"||this._inactive))switch(t){case"cooling":return"var(--state-climate-cool-color, #2196f3)";case"drying":return"var(--state-climate-dry-color, #ff9800)";case"fan":return"var(--state-climate-fan_only-color, #00bcd4)";default:return"var(--state-climate-heat-color, #ff5722)"}}_big(t,e=!0){if(t==null)return d`<span class="big"><span class="int">—</span></span>`;const o=new Intl.NumberFormat(ge(this.hass),{minimumFractionDigits:this._digits,maximumFractionDigits:this._digits}).format(t),i=o.includes(".")?o.split(".")[0]:o.split(",")[0],s=o.slice(i.length);return d`
      <span class="big">
        <span class="int">${i}</span>
        <span class="addon">
          <span class="decimal">${s}</span>
          <span class="unit">${e?this._unit:""}</span>
        </span>
      </span>
    `}_send(t){!this.hass||!this.stateObj||(this._pending.set(t),this.hass.callService("climate","set_temperature",{entity_id:this.stateObj.entity_id,...t}))}_setSingle(t){this._send({temperature:t})}_setRange(t,e){this._send({target_temp_low:t,target_temp_high:e})}_onStep(t){const e=o=>tt(o+t.detail.direction*this._step,this._min,this._max,this._step);if(this._supportsRange){const o=this._target("target_temp_low"),i=this._target("target_temp_high");if(this._bound==="low"){const s=e(o);s!==o&&s<=i&&this._setRange(s,i)}else{const s=e(i);s!==i&&s>=o&&this._setRange(o,s)}}else if(this._supportsTemperature){const o=this._target("temperature"),i=e(o);i!==o&&this._setSingle(i)}}_renderInfo(t,e,o,i,s){var u,h,f;const n=it(this.hass,"action",((u=this.stateObj)==null?void 0:u.attributes.hvac_action)??((h=this.stateObj)==null?void 0:h.state)),a=(f=this.stateObj)==null?void 0:f.attributes.current_humidity,l=this._actionColor(),r=Me(l?{color:l}:{});return d`
      <div class="overlay">
        ${n?d`<div class="action" style=${r}>${n}</div>`:c}
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
        ${e!=null||a!=null?d`<div class="secondary" style=${r}>
                ${e!=null?d`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${st} />
                        </svg>
                        ${new Intl.NumberFormat(ge(this.hass),{maximumFractionDigits:1}).format(e)}
                        ${this._unit}
                      </span>`:c}
                ${e!=null&&a!=null?d`<span class="sep">·</span>`:c}
                ${a!=null?d`<span class="reading">
                        <svg viewBox="0 0 24 24">
                          <path d=${Te} />
                        </svg>
                        ${new Intl.NumberFormat(ge(this.hass),{maximumFractionDigits:0}).format(a)}
                        %
                      </span>`:c}
              </div>`:c}
      </div>
    `}render(){if(!this.stateObj)return c;const e=this.stateObj.attributes.current_temperature,o=this._supportsRange,i=!o&&this._supportsTemperature,s=o?this._target("target_temp_low"):void 0,n=o?this._target("target_temp_high"):void 0,a=i?this._target("temperature"):void 0;return d`
      <div
        class="wrap"
        style=${Me({"--cgh-slider-color":this._stateColor(),"--cgh-slider-low":"var(--state-climate-heat-color, #ff5722)","--cgh-slider-high":"var(--state-climate-cool-color, #2196f3)","--cgh-action-color":this._actionColor()??"transparent"})}
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
            .value=${a??c}
            .low=${s??c}
            .high=${n??c}
            .current=${e??c}
            .disabled=${!i&&!o}
            @value-changed=${l=>l.detail.value!=null&&this._setSingle(l.detail.value)}
            @low-changed=${l=>{const r=l.detail.value;r!=null&&n!=null&&this._setRange(r,n)}}
            @high-changed=${l=>{const r=l.detail.value;r!=null&&s!=null&&this._setRange(s,r)}}
          ></cgh-circular-slider>

          ${this._renderInfo(o,e,a,s,n)}
          ${i||o?d`<div class="buttons">
                  <cgh-number-buttons
                    .hass=${this.hass}
                    .color=${o&&!this._inactive?this._bound==="high"?"var(--state-climate-cool-color, #2196f3)":"var(--state-climate-heat-color, #ff5722)":void 0}
                    @cgh-step=${this._onStep}
                  ></cgh-number-buttons>
                </div>`:c}
        </div>
      </div>
    `}};Q.styles=k`
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
  `,Pe([p({attribute:!1})],Q.prototype,"hass",2),Pe([p({attribute:!1})],Q.prototype,"stateObj",2),Pe([A()],Q.prototype,"_bound",2),Q=Pe([E("cgh-climate-temperature")],Q);var Qi=Object.defineProperty,es=Object.getOwnPropertyDescriptor,ct=(t,e,o,i)=>{for(var s=i>1?void 0:i?es(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&Qi(e,o,s),s};let _e=class extends H($){constructor(){super(...arguments),this._pending=new oo(this)}willUpdate(t){t.has("stateObj")&&this._pending.sync(t.get("stateObj"),this.stateObj)}get _target(){var t;return this._pending.get("humidity")??((t=this.stateObj)==null?void 0:t.attributes.humidity)}get _current(){var t;return(t=this.stateObj)==null?void 0:t.attributes.current_humidity}get _min(){var t;return((t=this.stateObj)==null?void 0:t.attributes.min_humidity)??0}get _max(){var t;return((t=this.stateObj)==null?void 0:t.attributes.max_humidity)??100}get _step(){var t;return((t=this.stateObj)==null?void 0:t.attributes.target_humidity_step)??1}get _inactive(){var e;const t=(e=this.stateObj)==null?void 0:e.state;return t==="off"||t==="unavailable"||t==="unknown"}_color(){return this._inactive?"var(--state-inactive-color, var(--disabled-color, #9e9e9e))":"var(--state-humidifier-on-color, #2196f3)"}_set(t){!this.hass||!this.stateObj||(this._pending.set({humidity:t}),this.hass.callService("climate","set_humidity",{entity_id:this.stateObj.entity_id,humidity:t}))}_onStep(t){const e=this._target;if(e==null)return;const o=tt(e+t.detail.direction*this._step,this._min,this._max,this._step);o!==e&&this._set(o)}_format(t){return new Intl.NumberFormat(ge(this.hass),{maximumFractionDigits:0}).format(t)}render(){if(!this.stateObj)return c;const t=this._target,e=this._current;return d`
      <div
        class="wrap"
        style=${Me({"--cgh-slider-color":this._color()})}
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
                      <path d=${Te} />
                    </svg>
                    ${this._format(e)} %
                  </div>`:c}
          </div>

          <div class="buttons">
            <cgh-number-buttons
              .hass=${this.hass}
              @cgh-step=${this._onStep}
            ></cgh-number-buttons>
          </div>
        </div>
      </div>
    `}};_e.styles=k`
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
  `,ct([p({attribute:!1})],_e.prototype,"hass",2),ct([p({attribute:!1})],_e.prototype,"stateObj",2),_e=ct([E("cgh-climate-humidity")],_e);var ts=Object.defineProperty,os=Object.getOwnPropertyDescriptor,De=(t,e,o,i)=>{for(var s=i>1?void 0:i?os(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&ts(e,o,s),s};const is=4;let ee=class extends H($){constructor(){super(...arguments),this._view="temperature"}get _hasHumidity(){var e;return((((e=this.stateObj)==null?void 0:e.attributes.supported_features)??0)&is)!==0}render(){const t=this._hasHumidity?this._view:"temperature";return d`
      <div class="control">
        ${t==="humidity"?d`<cgh-climate-humidity
                .hass=${this.hass}
                .stateObj=${this.stateObj}
              ></cgh-climate-humidity>`:d`<cgh-climate-temperature
                .hass=${this.hass}
                .stateObj=${this.stateObj}
              ></cgh-climate-temperature>`}
        ${this._hasHumidity?d`<div class="toggle">
                <button
                  class="seg ${t==="temperature"?"active":""}"
                  aria-label=${this.t("common.temperature")}
                  @click=${()=>this._view="temperature"}
                >
                  <svg viewBox="0 0 24 24"><path d=${st} /></svg>
                </button>
                <button
                  class="seg ${t==="humidity"?"active":""}"
                  aria-label=${this.t("common.humidity")}
                  @click=${()=>this._view="humidity"}
                >
                  <svg viewBox="0 0 24 24"><path d=${Te} /></svg>
                </button>
              </div>`:c}
      </div>
    `}};ee.styles=k`
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
  `,De([p({attribute:!1})],ee.prototype,"hass",2),De([p({attribute:!1})],ee.prototype,"stateObj",2),De([A()],ee.prototype,"_view",2),ee=De([E("cgh-climate-control")],ee);var ss=Object.defineProperty,ns=Object.getOwnPropertyDescriptor,V=(t,e,o,i)=>{for(var s=i>1?void 0:i?ns(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&ss(e,o,s),s};let O=class extends ${constructor(){super(...arguments),this.label="",this.options=[],this.disabled=!1,this._open=!1,this._up=!1,this._onDocumentClick=t=>{t.composedPath().includes(this)||(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick)}get _valueLabel(){var t;return((t=this.options.find(e=>e.value===this.value))==null?void 0:t.label)??this.value??""}_toggle(){if(this.disabled)return;if(this._open){this._open=!1;return}const t=this.getBoundingClientRect(),e=Math.min(this.options.length*48+8,400),o=window.innerHeight-t.bottom;this._up=o<e&&t.top>o,this._open=!0}_select(t){this._open=!1,this.dispatchEvent(new CustomEvent("cgh-select",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return d`
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
    `}};O.styles=k`
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
  `,V([p()],O.prototype,"icon",2),V([p()],O.prototype,"label",2),V([p()],O.prototype,"value",2),V([p({attribute:!1})],O.prototype,"options",2),V([p({type:Boolean})],O.prototype,"disabled",2),V([A()],O.prototype,"_open",2),V([A()],O.prototype,"_up",2),O=V([E("cgh-select-tile")],O);var as=Object.defineProperty,rs=Object.getOwnPropertyDescriptor,He=(t,e,o,i)=>{for(var s=i>1?void 0:i?rs(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&as(e,o,s),s};const ls=8,cs=16,ds=32,us=512;let te=class extends H($){constructor(){super(...arguments),this.tiles=["mode","preset","fan","swing","swing_horizontal"]}_call(t,e){!this.hass||!this.stateObj||this.hass.callService("climate",t,{entity_id:this.stateObj.entity_id,...e})}_options(t,e){const o=this.stateObj;return e.map(i=>{var s,n;return{value:i,label:((n=(s=this.hass)==null?void 0:s.formatEntityAttributeValue)==null?void 0:n.call(s,o,t,i))??i}})}render(){const t=this.stateObj,e=t==null?void 0:t.attributes;if(!t||!e)return c;const o=e.supported_features??0,i=e.hvac_modes??[],s=e.preset_modes??[],n=e.fan_modes??[],a=e.swing_modes??[],l=e.swing_horizontal_modes??[];return d`
      <div class="tiles">
        ${this.tiles.includes("mode")&&i.length?d`<cgh-select-tile
                .icon=${to(t.state)}
                .label=${this.t("tile.mode")}
                .value=${t.state}
                .options=${i.map(r=>({value:r,label:it(this.hass,"mode",r),icon:to(r)}))}
                @cgh-select=${r=>this._call("set_hvac_mode",{hvac_mode:r.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("preset")&&(o&cs)!==0&&s.length?d`<cgh-select-tile
                .icon=${Yt}
                .label=${this.t("tile.preset")}
                .value=${e.preset_mode}
                .options=${this._options("preset_mode",s)}
                @cgh-select=${r=>this._call("set_preset_mode",{preset_mode:r.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("fan")&&(o&ls)!==0&&n.length?d`<cgh-select-tile
                .icon=${qt}
                .label=${this.t("tile.fan")}
                .value=${e.fan_mode}
                .options=${this._options("fan_mode",n)}
                @cgh-select=${r=>this._call("set_fan_mode",{fan_mode:r.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("swing")&&(o&ds)!==0&&a.length?d`<cgh-select-tile
                .icon=${Jt}
                .label=${this.t("tile.swing")}
                .value=${e.swing_mode}
                .options=${this._options("swing_mode",a)}
                @cgh-select=${r=>this._call("set_swing_mode",{swing_mode:r.detail.value})}
              ></cgh-select-tile>`:c}
        ${this.tiles.includes("swing_horizontal")&&(o&us)!==0&&l.length?d`<cgh-select-tile
                .icon=${Jt}
                .label=${this.t("tile.swing_horizontal")}
                .value=${e.swing_horizontal_mode}
                .options=${this._options("swing_horizontal_mode",l)}
                @cgh-select=${r=>this._call("set_swing_horizontal_mode",{swing_horizontal_mode:r.detail.value})}
              ></cgh-select-tile>`:c}
      </div>
    `}};te.styles=k`
    :host {
      display: block;
    }
    .tiles {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
    .tiles cgh-select-tile {
      flex: 1 1 120px;
      max-width: 160px;
    }
  `,He([p({attribute:!1})],te.prototype,"hass",2),He([p({attribute:!1})],te.prototype,"stateObj",2),He([p({attribute:!1})],te.prototype,"tiles",2),te=He([E("cgh-feature-tiles")],te);class hs{constructor(e,o=15e3){this.host=e,this.intervalMs=o,e.addController(this)}hostConnected(){this._timer=window.setInterval(()=>this.host.requestUpdate(),this.intervalMs)}hostDisconnected(){this._timer!==void 0&&(window.clearInterval(this._timer),this._timer=void 0)}}const io=k`
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
  /* Size, not an outline/border: those already mean isolated/OOB/offline, and a
     master can be any of them. */
  .dot.master {
    width: 12px;
    height: 12px;
  }
  .dot.oob {
    outline: 1px solid var(--warning-color, #ff9800);
    outline-offset: 1px;
    box-shadow: 0 0 6px var(--warning-color, #ff9800);
  }
`,ms=["switch","window","presence","boost","hold","schedule"];function ps(t,e=ms){for(const o of e){const i=t.find(s=>s.kind===o);if(i)return i}}function so(t,e,o=[],i=[],s){return t.map(n=>{var a;return{id:n,state:((a=e[n])==null?void 0:a.state)??"unavailable",isolated:o.includes(n),oob:i.includes(n),master:n===s}})}function no(t){const e=t.state==="off"?"off":t.state==="unavailable"||t.state==="unknown"?"unavailable":"active",o=[t.isolated?"isolated":"",t.oob?"oob":"",t.master?"master":""].filter(Boolean).join(" ");return o?`${e} ${o}`:e}var fs=Object.defineProperty,gs=Object.getOwnPropertyDescriptor,oe=(t,e,o,i)=>{for(var s=i>1?void 0:i?gs(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&fs(e,o,s),s};let z=class extends H($){constructor(){super(...arguments),this.members=[],this.isolated=[],this.oob=[]}_name(t){var e,o;return((o=(e=this.hass)==null?void 0:e.states[t])==null?void 0:o.attributes.friendly_name)??t}_action(t){var i;const e=(i=this.hass)==null?void 0:i.states[t],o=(e==null?void 0:e.attributes.hvac_action)??(e==null?void 0:e.state);return!o||o==="unavailable"||o==="unknown"?this.t("member.unavailable"):it(this.hass,"action",o)}render(){var e;if(!this.members.length)return c;const t=so(this.members,((e=this.hass)==null?void 0:e.states)??{},this.isolated,this.oob,this.master);return d`
      <div class="list" role="list">
        ${t.map(o=>{var s,n;const i=gi((n=(s=this.hass)==null?void 0:s.states[o.id])==null?void 0:n.attributes,this.hass);return d`
            <div class="member" role="listitem">
              <span class="dot ${no(o)}"></span>
              <span class="name" title=${o.id}>${this._name(o.id)}</span>
              ${o.master?d`<svg class="mark" viewBox="0 0 24 24">
                      <path d=${Wi} />
                    </svg>`:c}
              ${o.isolated?d`<svg class="mark" viewBox="0 0 24 24">
                      <path d=${at} />
                    </svg>`:c}
              ${o.oob?d`<svg class="mark oob" viewBox="0 0 24 24">
                      <path d=${Qt} />
                    </svg>`:c}
              <span class="action">${this._action(o.id)}</span>
              <span class="target">${i??""}</span>
            </div>
          `})}
      </div>
    `}};z.styles=[io,k`
      :host {
        display: block;
        font-size: var(--ha-font-size-s, 0.75rem);
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .member {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 6px;
        border-radius: var(--ha-border-radius-sm, 8px);
      }
      .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--primary-text-color);
      }
      .mark {
        flex: none;
        width: 14px;
        height: 14px;
        fill: var(--secondary-text-color);
      }
      .mark.oob {
        fill: var(--warning-color, #ff9800);
      }
      .action {
        flex: none;
        color: var(--secondary-text-color);
        text-transform: capitalize;
      }
      .target {
        flex: none;
        min-width: 46px;
        text-align: right;
        color: var(--secondary-text-color);
        font-variant-numeric: tabular-nums;
      }
    `],oe([p({attribute:!1})],z.prototype,"hass",2),oe([p({attribute:!1})],z.prototype,"members",2),oe([p({attribute:!1})],z.prototype,"isolated",2),oe([p({attribute:!1})],z.prototype,"oob",2),oe([p({attribute:!1})],z.prototype,"master",2),z=oe([E("cgh-member-list")],z);var _s=Object.defineProperty,vs=Object.getOwnPropertyDescriptor,ie=(t,e,o,i)=>{for(var s=i>1?void 0:i?vs(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&_s(e,o,s),s};const bs=10,ys=["window","presence","schedule","sync","isolation","calibration"],ao={switch:{labelKey:"block.switch",icon:Zt},window:{labelKey:"block.window",icon:nt},presence:{labelKey:"block.presence",icon:Xt}},ro={window:{labelKey:"feature.window",icon:nt},presence:{labelKey:"feature.presence",icon:Xt},schedule:{labelKey:"feature.schedule",icon:rt},sync:{labelKey:"feature.sync",icon:lt},isolation:{labelKey:"feature.isolation",icon:at},calibration:{labelKey:"feature.calibration",icon:Yt}},dt={ui:{labelKey:"source.manual",icon:eo},group:{labelKey:"source.manual",icon:eo},sync_mode:{labelKey:"source.sync",icon:lt},adopt_only:{labelKey:"source.mirror",icon:lt},window_control:{labelKey:"source.window",icon:nt},schedule:{labelKey:"source.schedule",icon:rt}};let j=class extends H($){constructor(){super(...arguments),this.sections=["panel","badges","deviations"],this._clock=new hs(this),this._membersOpen=!1,this._membersUp=!1,this._onDocumentClick=t=>{if(!this._membersOpen)return;const e=this.renderRoot.querySelector(".members");e&&!t.composedPath().includes(e)&&(this._membersOpen=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocumentClick)}_toggleMembers(){var e;if(this._membersOpen){this._membersOpen=!1;return}const t=(e=this.renderRoot.querySelector(".members"))==null?void 0:e.getBoundingClientRect();if(t){const o=window.innerHeight-t.bottom;this._membersUp=o<320&&t.top>o}this._membersOpen=!0}_items(){var a;const t=(a=this.stateObj)==null?void 0:a.attributes;if(!t)return[];const e=[],o=t.blocking_reason;if(o!=null&&o.source&&ao[o.source]){const l=ao[o.source],r=o.since?Date.parse(o.since):NaN,u=Number.isNaN(r)?void 0:Math.floor((Date.now()-r)/6e4);e.push({kind:o.source,icon:l.icon,label:u==null?this.t(l.labelKey):`${this.t(l.labelKey)} · ${this.t("status.blocking_for",{duration:fi(u,this.hass)})}`})}const i=Gt(t.boost_until);i!=null&&e.push({kind:"boost",icon:Bi,label:this.t("status.boost",{minutes:i})});const s=Gt(t.schedule_hold_until);s!=null&&e.push({kind:"hold",icon:Fi,label:this.t("status.hold",{minutes:s})});const n=t.active_schedule_slot_title;return n&&e.push({kind:"schedule",icon:rt,label:n}),e}_panel(t){var i;const e=ps(t);if(e)return e;const o=(i=this.stateObj)==null?void 0:i.attributes.last_source;if(o&&dt[o])return{kind:"source",icon:dt[o].icon,label:this.t(dt[o].labelKey)}}_featureActive(t){var i;const e=((i=this.stateObj)==null?void 0:i.attributes)??{},o=e.blocking_sources??[];switch(t){case"window":return o.includes("window");case"presence":return o.includes("presence");case"schedule":return e.last_source==="schedule";case"sync":return e.last_source==="sync_mode"||e.last_source==="adopt_only";case"isolation":return(e.isolated_members??[]).length>0;default:return!1}}_featurePaused(t){var i;const e=((i=this.stateObj)==null?void 0:i.attributes)??{},o=e.config_overrides??{};switch(t){case"window":return o.window_mode==="disabled";case"presence":return o.presence_mode==="disabled";case"calibration":return o.calibration_mode==="disabled";case"sync":return e.effective_sync_mode==="disabled";case"isolation":return o.isolation_bypass==="all";default:return!1}}_scheduleOn(){var e,o,i;const t=(e=this.stateObj)==null?void 0:e.attributes.active_schedule_entity;return!!t&&((i=(o=this.hass)==null?void 0:o.states[t])==null?void 0:i.state)==="on"}_nextEvent(t){var i,s;if(!t)return;const e=(s=(i=this.hass)==null?void 0:i.states[t])==null?void 0:s.attributes.next_event;if(!e)return;const o=new Date(e);if(!isNaN(o.getTime()))return pi(o,this.hass,{hour:"2-digit",minute:"2-digit"})}_name(t){var e,o;return((o=(e=this.hass)==null?void 0:e.states[t])==null?void 0:o.attributes.friendly_name)??t}_names(t){return t.map(e=>this._name(e)).join(", ")}_divergenceLabel(t){var o,i;if(t==="hvac_mode")return this.t("tile.mode");const e=this.stateObj;return e&&((i=(o=this.hass)==null?void 0:o.formatEntityAttributeName)==null?void 0:i.call(o,e,t))||t}_divergenceValue(t,e,o){var n,a,l,r,u;const i=(n=this.hass)==null?void 0:n.states[t];return(i?e==="hvac_mode"?(l=(a=this.hass)==null?void 0:a.formatEntityState)==null?void 0:l.call(a,i,String(o)):(u=(r=this.hass)==null?void 0:r.formatEntityAttributeValue)==null?void 0:u.call(r,i,e,o):void 0)??String(o)}_divergenceText(t,e){return Object.entries(e).map(([o,i])=>`${this._name(o)} ${this._divergenceValue(o,t,i)}`).join(", ")}render(){var G,ye;const t=(G=this.stateObj)==null?void 0:G.attributes;if(!t)return c;const e=this._items(),o=this._panel(e),i=this.sections.includes("panel"),s=this.sections.includes("badges"),n=this.sections.includes("deviations"),a=t.enabled_features??[],l=ys.filter(g=>a.includes(g)),r=t.isolated_members??[],u=t.oob_members??[],h=t.member_divergence??{},f=Object.keys(h),w=!!(r.length||u.length||f.length),x=t.member_entities??[],T=t.master_entity_id,_=so(x,((ye=this.hass)==null?void 0:ye.states)??{},r,u,T),je=_.slice(0,bs),C=_.length-je.length,F=t.total_member_count??_.length,S=t.active_member_count??_.filter(g=>g.state!=="off"&&g.state!=="unavailable"&&g.state!=="unknown").length,W=t.active_schedule_slot_title,_t=t.active_schedule_entity,vt=this._scheduleOn(),ne=!((o==null?void 0:o.kind)==="schedule")&&W||(vt||W?this.t("status.active"):void 0),L=this._nextEvent(_t);return d`
      <div class="status">
        ${i?d`<div class="panel ${(o==null?void 0:o.kind)??""}">
                ${F?d`<div class="members">
                        <button
                          class="members-toggle"
                          aria-expanded=${this._membersOpen}
                          @click=${this._toggleMembers}
                        >
                          <span class="dots">
                            ${je.map(g=>d`<span
                                  class="dot ${no(g)}"
                                  title=${this._name(g.id)}
                                ></span>`)}
                            ${C>0?d`<span class="more">+${C}</span>`:c}
                          </span>
                          <span class="count">${S}/${F}</span>
                        </button>
                        ${this._membersOpen?d`<div
                                class="members-menu ${this._membersUp?"up":""}"
                              >
                                <cgh-member-list
                                  .hass=${this.hass}
                                  .members=${x}
                                  .isolated=${r}
                                  .oob=${u}
                                  .master=${T}
                                ></cgh-member-list>
                              </div>`:c}
                      </div>`:c}
                ${o?d`<div class="panel-main">
                        <svg viewBox="0 0 24 24"><path d=${o.icon} /></svg>
                        <span>${o.label}</span>
                      </div>`:c}
                ${ne||L?d`<div class="panel-info">
                        ${ne?d`<span class="slot">${ne}</span>`:c}
                        ${L?d`<span class="next"
                              >${this.t("status.next",{time:L})}</span
                            >`:c}
                      </div>`:c}
              </div>`:c}
        ${s&&(l.length||e.some(g=>g.kind==="boost"))?d`<div class="badges">
                ${l.map(g=>d`<div
                    class="badge feature ${g} ${this._featureActive(g)?"on":this._featurePaused(g)?"paused":""}"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d=${ro[g].icon} />
                    </svg>
                    <span>${this.t(ro[g].labelKey)}</span>
                  </div>`)}
                ${e.filter(g=>g.kind==="boost"||g.kind==="hold").map(g=>d`<div class="badge ${g.kind} on">
                      <svg viewBox="0 0 24 24"><path d=${g.icon} /></svg>
                      <span>${g.label}</span>
                    </div>`)}
              </div>`:c}
        ${n?d`<div class="deviations ${w?"":"empty"}">
                ${r.length?d`<div class="deviation isolation">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${at} />
                          </svg>
                          <span
                            >${this.t("status.isolated",{count:r.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(r)}</div>
                      </div>`:c}
                ${u.length?d`<div class="deviation oob">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${Qt} />
                          </svg>
                          <span
                            >${this.t("status.oob",{count:u.length})}</span
                          >
                        </div>
                        <div class="dev-names">${this._names(u)}</div>
                      </div>`:c}
                ${f.length?d`<div class="deviation divergence">
                        <div class="dev-head">
                          <svg viewBox="0 0 24 24">
                            <path d=${Gi} />
                          </svg>
                          <span
                            >${this.t("status.divergence",{count:f.length})}</span
                          >
                        </div>
                        <div class="dev-names">
                          ${f.map(g=>`${this._divergenceLabel(g)}: ${this._divergenceText(g,h[g])}`).join(" · ")}
                        </div>
                      </div>`:c}
                ${w?c:d`<div class="deviation none">
                        ${this.t("status.no_deviations")}
                      </div>`}
              </div>`:c}
      </div>
    `}};j.styles=[io,k`
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
    .members {
      position: relative;
      align-self: flex-end;
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
      min-width: 200px;
      max-width: 280px;
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
    .panel-main span {
      overflow: hidden;
      text-overflow: ellipsis;
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
    .dev-names {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    `],ie([p({attribute:!1})],j.prototype,"hass",2),ie([p({attribute:!1})],j.prototype,"stateObj",2),ie([p({attribute:!1})],j.prototype,"sections",2),ie([A()],j.prototype,"_membersOpen",2),ie([A()],j.prototype,"_membersUp",2),j=ie([E("cgh-status")],j);const Ve=["panel","badges","deviations"],ut=["mode","preset","fan","swing","swing_horizontal"],ht=t=>{const e=t==null?void 0:t.status;return e===!1?null:Array.isArray(e)?Ve.filter(o=>e.includes(o)):[...Ve]},mt=t=>{const e=t==null?void 0:t.features;return Array.isArray(e)?ut.filter(o=>e.includes(o)):[...ut]},pt="climate.demo",lo="schedule.demo_schedule",co="calendar.demo_calendar",uo=3500,I=[{id:"climate.demo_living_room",nameKey:"demo.room.living_room"},{id:"climate.demo_bedroom",nameKey:"demo.room.bedroom"},{id:"climate.demo_bathroom",nameKey:"demo.room.bathroom"},{id:"climate.demo_kitchen",nameKey:"demo.room.kitchen"}],ws=I[0].id,$s=1,xs=2,ks=4,As=8,Cs=16,Es=32,Ss=512,ho=["heat","cool","heat_cool","auto","dry","fan_only","off"],Ms=ho.filter(t=>t!=="off"),Os=["none","eco","comfort","away"],Ls=["window","presence","schedule","sync","isolation","range_template","calibration","master"],Ts=12,Ps=16,Ds=2,mo=25,ft=t=>Math.round(t*10)/10,Hs=t=>Math.round(t*2)/2,Vs=t=>t.length?t.reduce((e,o)=>e+o,0)/t.length:void 0,ve=(t,e,o)=>({entity_id:t,state:e,attributes:o}),zs=t=>{let e=t+1831565813|0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296},po=(t,e,o,i,s)=>{switch(t){case"off":return"off";case"dry":return"drying";case"fan_only":return"fan";case"heat":return o!=null&&e<o?"heating":"idle";case"cool":return o!=null&&e>o?"cooling":"idle";default:{const n=i??(o!=null?o-.5:void 0),a=s??(o!=null?o+.5:void 0);return n!=null&&e<n?"heating":a!=null&&e>a?"cooling":"idle"}}},js=t=>{const e={};if(t.length<2)return e;const o=Object.fromEntries(t.map(i=>[i.entity_id,i.state]));new Set(Object.values(o)).size>1&&(e.hvac_mode=o);for(const i of["temperature","target_temp_low","target_temp_high"]){const s=Object.fromEntries(t.filter(n=>n.attributes[i]!=null).map(n=>[n.entity_id,n.attributes[i]]));new Set(Object.values(s)).size>1&&(e[i]=s)}return e},Is=(t=Date.now(),e)=>{const o=m=>ot(e,m),i=Math.floor(t/uo),s=m=>zs(Math.imul(i,2654435761)+m),n=(m,b)=>s(b)<m,a=(m,b)=>m[Math.floor(s(b)*m.length)],l=n(.6,2),r=n(.8,16),u=Ls.filter((m,b)=>n(.5,100+b)),h=m=>u.includes(m),f=u.length>0,w=[["normal",4],["off",1],["boost",1],["hold",h("schedule")?1:0],["window_off",h("window")?1:0],["window_temperature",h("window")?1:0],["presence_off",h("presence")?1:0],["presence_offset",h("presence")?1:0],["presence_temperature",h("presence")?1:0],["presence_preset",h("presence")&&r?1:0],["switch",f?1:0]],x=w.reduce((m,[,b])=>m+b,0);let T=s(1)*x;const _=(w.find(([,m])=>(T-=m)<0)??w[0])[0],je=_==="normal"||_==="hold",C=[];_==="switch"&&C.push("switch"),_.startsWith("window")&&C.push("window"),_.startsWith("presence")&&C.push("presence"),_==="switch"&&h("window")&&n(.3,131)&&C.push("window"),(_==="switch"||_.startsWith("window"))&&h("presence")&&n(.3,132)&&C.push("presence");const F=["switch","window","presence"].find(m=>C.includes(m)),S={};h("window")&&!C.includes("window")&&n(.2,140)&&(S.window_mode="disabled"),h("presence")&&!C.includes("presence")&&n(.2,141)&&(S.presence_mode="disabled"),h("calibration")&&n(.2,142)&&(S.calibration_mode="disabled"),h("isolation")&&n(.2,143)&&(S.isolation_bypass="all"),h("sync")&&n(.2,144)&&(S.sync_mode="disabled");const W=h("sync")?S.sync_mode==="disabled"?"disabled":a(["lock","mirror","mirror_lock","master_lock","adopt_only"],145):"disabled",_t=W==="disabled"||W==="lock"?[]:[W==="adopt_only"?"adopt_only":"sync_mode"],vt=_==="window_temperature"||_==="presence_offset"||_==="presence_temperature"||_==="presence_preset",go=_==="boost"&&n(.3,3),ne=_==="off"||go?"off":vt||_==="boost"?"heat":a(Ms,4),L=ne==="heat_cool"&&l,G=Hs(18+s(5)*6),ye=L?G-1.5:void 0,g=L?G+1.5:void 0,Zs=r?a(["none","none","eco","comfort"],6):void 0;let ae=ne,re=L?void 0:G,bt=Zs;switch(_){case"switch":case"window_off":case"presence_off":ae="off";break;case"boost":ae="heat",re=mo;break;case"window_temperature":re=Ts;break;case"presence_offset":re=G-Ds;break;case"presence_temperature":re=Ps;break;case"presence_preset":bt="away";break}(F==="switch"||F==="window"&&_==="window_off")&&(ae="off");const _o=ft(19+s(7)*5),Ie=n(.12,20)?Math.floor(s(21)*I.length):-1,we=h("isolation")&&!S.isolation_bypass&&n(.5,22)?[0,1,2,3].filter(m=>m!==Ie)[Math.floor(s(23)*3)]:-1,yt=[0,1,2,3].filter(m=>m!==Ie&&m!==we),wt=je&&ae!=="off",$e=wt&&n(.15,24)?a(yt,25):-1,vo=wt&&n(.2,26)?a(yt.filter(m=>m!==$e),27):-1,bo=wt&&n(.2,28)?a(yt.filter(m=>m!==$e&&m!==vo),29):-1,yo=n(.5,30)?.5:-.5,Re={},Ne=[];I.forEach((m,b)=>{const le=o(m.nameKey);if(b===Ie){Re[m.id]=ve(m.id,"unavailable",{friendly_name:le});return}const Mo=ft(_o+(s(40+b)-.5)),Oo=b===we||b===$e||b===vo?"off":ae,Lo=re!=null?re+(b===bo?yo:0):void 0,To=ye!=null?ye+(b===bo?yo:0):void 0,Po=ve(m.id,Oo,{friendly_name:le,current_temperature:Mo,temperature:Lo,target_temp_low:To,target_temp_high:g,preset_mode:bt,hvac_action:po(Oo,Mo,Lo,To,g)});Re[m.id]=Po,b!==we&&Ne.push(Po)});const wo=Ne.filter(m=>m.state!=="off").length?ae:"off",Ue=m=>{const b=Vs(Ne.map(le=>le.attributes[m]).filter(le=>le!=null));return b!=null?ft(b):void 0},$o=Ue("current_temperature")??_o,xo=L?void 0:Ue("temperature"),ko=L?Ue("target_temp_low"):void 0,Ao=L?Ue("target_temp_high"):void 0,Co=js(Ne),qs=Object.values(Re).filter(m=>m.state!=="off"&&m.state!=="unavailable").length,$t=n(.5,50),Eo=$t?co:lo,xe=h("schedule")&&(_==="hold"||n(.6,51)),So=["ui","group",..._t],xt=_==="hold"?a(So,60):xe&&n(.6,61)?"schedule":a(So,62),Ys=new Date(t-Math.round(1+s(70)*20)*6e4),Js=ve(pt,wo,{friendly_name:o("demo.group"),min_temp:5,max_temp:35,target_temp_step:.5,current_temperature:$o,temperature:xo,target_temp_low:ko,target_temp_high:Ao,current_humidity:35+Math.round(s(8)*30),humidity:40+Math.round(s(9)*25),min_humidity:0,max_humidity:100,target_humidity_step:1,hvac_action:po(wo,$o,xo,ko,Ao),hvac_modes:ho,preset_modes:Os,preset_mode:bt,fan_modes:["low","medium","high"],fan_mode:a(["low","medium","high"],11),swing_modes:["off","on"],swing_mode:a(["off","on"],12),swing_horizontal_modes:["off","on"],swing_horizontal_mode:a(["off","on"],13),supported_features:$s|(l?xs:0)|(n(.6,14)?ks:0)|(n(.7,15)?As:0)|(r?Cs:0)|(n(.5,17)?Es:0)|(n(.4,18)?Ss:0),active_member_count:qs,total_member_count:I.length,member_entities:I.map(m=>m.id),enabled_features:u,blocking_sources:C,blocking_reason:F?{source:F,since:Ys.toISOString()}:void 0,isolated_members:we>=0?[I[we].id]:[],oob_members:$e>=0?[I[$e].id]:[],member_divergence:Co,config_overrides:Object.keys(S).length?S:void 0,effective_sync_mode:f?W:void 0,assumed_state:Object.keys(Co).length>0,last_source:xt,last_entity:xt==="sync_mode"||xt==="adopt_only"?a(I,63).id:void 0,last_changed:new Date(t-Math.round(s(64)*10)*6e4).toISOString(),active_schedule_entity:h("schedule")?Eo:void 0,active_schedule_slot_title:xe&&$t?o("demo.slot"):void 0,boost_temperature:_==="boost"?mo:void 0,boost_until:_==="boost"?new Date(t+(1+s(80)*15)*6e4).toISOString():void 0,schedule_hold_until:_==="hold"?new Date(t+(5+s(81)*55)*6e4).toISOString():void 0,group_offset:f&&n(.3,82)?.5:0,master_entity_id:h("master")?ws:void 0,master_fallback_active:h("master")&&Ie===0,presence_fallback:h("presence")&&n(.2,83)?!0:void 0}),Xs=$t?ve(co,xe?"on":"off",{friendly_name:o("demo.schedule"),message:xe?o("demo.slot"):void 0}):ve(lo,xe?"on":"off",{friendly_name:o("demo.schedule"),next_event:new Date(t+(1+s(90)*90)*6e4).toISOString()});return{[pt]:Js,[Eo]:Xs,...Re}};async function Rs(){var t,e,o,i;if(!customElements.get("ha-entity-picker"))try{const s=window.loadCardHelpers;if(s){const n=await s(),a=await((t=n==null?void 0:n.createCardElement)==null?void 0:t.call(n,{type:"entities",entities:[]}));if(await((e=a==null?void 0:a.getConfigElement)==null?void 0:e.call(a)),!customElements.get("ha-entity-picker")&&(n!=null&&n.createRowElement)){const l=await n.createRowElement({type:"attribute"});await((o=l==null?void 0:l.getConfigElement)==null?void 0:o.call(l))}}if(!customElements.get("ha-entity-picker")){const n=customElements.get("hui-glance-card");await((i=n==null?void 0:n.getConfigElement)==null?void 0:i.call(n))}}catch(s){console.warn("[climate-group-helper-card] Failed to preload HA form components:",s)}}var Ns=Object.defineProperty,Us=Object.getOwnPropertyDescriptor,ze=(t,e,o,i)=>{for(var s=i>1?void 0:i?Us(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&Ns(e,o,s),s};const Ks={panel:"editor.section.panel",badges:"editor.section.badges",deviations:"editor.section.deviations"},Bs={mode:"tile.mode",preset:"tile.preset",fan:"tile.fan",swing:"tile.swing",swing_horizontal:"tile.swing_horizontal"};let se=class extends H($){setConfig(t){this._config=t}connectedCallback(){super.connectedCallback(),Rs().then(()=>this.requestUpdate())}_emit(t){if(!this._config)return;const e={...this._config,...t};e.name===""&&delete e.name,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}_entityChanged(t){this._emit({entity:t.detail.value})}_nameChanged(t){this._emit({name:t.target.value})}_demoChanged(t){var o;const e=t.target.checked;if(!e&&!((o=this._config)!=null&&o.entity)){this.requestUpdate();return}this._emit({demo:e})}_statusOffChanged(t){const e=t.target.checked;this._emit({status:e?!1:[...Ve]})}_sectionChanged(t,e){const o=e.target.checked,i=ht(this._config)??[];this._emit({status:o?[...i,t]:i.filter(s=>s!==t)})}_tileChanged(t,e){const o=e.target.checked,i=mt(this._config);this._emit({features:o?[...i,t]:i.filter(s=>s!==t)})}render(){if(!this._config)return c;const t=ht(this._config),e=mt(this._config),o=this._config.status===!1;return d`
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
            .checked=${this._config.demo===!0}
            @change=${this._demoChanged}
          />
          <span>${this.t("editor.demo")}</span>
        </label>

        <fieldset>
          <legend>${this.t("editor.status_cell")}</legend>
          <label class="check">
            <input
              type="checkbox"
              .checked=${o}
              @change=${this._statusOffChanged}
            />
            <span>${this.t("editor.hide_status")}</span>
          </label>
          <div class="sub ${o?"off":""}">
            ${Ve.map(i=>d`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${(t==null?void 0:t.includes(i))??!1}
                    ?disabled=${o}
                    @change=${s=>this._sectionChanged(i,s)}
                  />
                  <span>${this.t(Ks[i])}</span>
                </label>
              `)}
          </div>
        </fieldset>

        <fieldset>
          <legend>${this.t("editor.feature_tiles")}</legend>
          <div class="sub">
            ${ut.map(i=>d`
                <label class="check">
                  <input
                    type="checkbox"
                    .checked=${e.includes(i)}
                    @change=${s=>this._tileChanged(i,s)}
                  />
                  <span>${this.t(Bs[i])}</span>
                </label>
              `)}
          </div>
        </fieldset>
      </div>
    `}};se.styles=k`
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
    .sub.off {
      opacity: 0.5;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
  `,ze([p({attribute:!1})],se.prototype,"hass",2),ze([p({attribute:!1})],se.prototype,"lovelace",2),ze([A()],se.prototype,"_config",2),se=ze([E("climate-group-helper-card-editor")],se);var Fs=Object.defineProperty,Ws=Object.getOwnPropertyDescriptor,gt=(t,e,o,i)=>{for(var s=i>1?void 0:i?Ws(e,o):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(s=(i?a(e,o,s):a(s))||s);return i&&s&&Fs(e,o,s),s};const Gs=new Set(["type","entity","name","status","features","demo"]);let be=class extends H($){setConfig(t){if(!t.entity&&!t.demo)throw new Error('climate-group-helper-card: "entity" is required');for(const e of Object.keys(t))Gs.has(e)||console.warn(`[climate-group-helper-card] ignoring unknown config key: ${e}`);this._config=t,this._syncDemoTimer()}connectedCallback(){super.connectedCallback(),this._syncDemoTimer()}disconnectedCallback(){super.disconnectedCallback(),this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_syncDemoTimer(){var e;const t=!!((e=this._config)!=null&&e.demo);t&&this._demoTimer===void 0?(this._demoTimer=window.setInterval(()=>this.requestUpdate(),uo),this.requestUpdate()):!t&&this._demoTimer!==void 0&&(window.clearInterval(this._demoTimer),this._demoTimer=void 0)}_entityId(){var t,e;return(t=this._config)!=null&&t.demo?pt:(e=this._config)==null?void 0:e.entity}_effectiveHass(){var t,e;if(this.hass)return(t=this._config)!=null&&t.demo?{...this.hass,states:{...this.hass.states,...Is(Date.now(),((e=this.hass.locale)==null?void 0:e.language)??this.hass.language)},callService:async()=>{}}:this.hass}getCardSize(){return 6}static getStubConfig(t,e=[],o=[]){const i="custom:climate-group-helper-card",s=[...e,...o],n=s.find(l=>{var r,u,h;return((h=(u=(r=t==null?void 0:t.states)==null?void 0:r[l])==null?void 0:u.attributes)==null?void 0:h.enabled_features)!==void 0});if(n)return{type:i,entity:n};const a=s.find(l=>l.startsWith("climate."));return a?{type:i,entity:a}:{type:i,demo:!0}}static async getConfigElement(){return document.createElement("climate-group-helper-card-editor")}_renderStatus(t,e){const o=ht(this._config);return!o||!o.length?c:d`
      <div class="status">
        <cgh-status
          .hass=${t}
          .stateObj=${e}
          .sections=${o}
        ></cgh-status>
      </div>
    `}_handleMoreInfo(){var e;const t=this._entityId();!t||(e=this._config)!=null&&e.demo||this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t},bubbles:!0,composed:!0}))}render(){const t=this._effectiveHass(),e=this._entityId();if(!this._config||!t||!e)return c;const o=t.states[e];return o?d`
      <ha-card>
        ${this._config.demo?c:d`<button
                class="more-info"
                aria-label=${this.t("card.more_info")}
                @click=${this._handleMoreInfo}
              >
                <svg viewBox="0 0 24 24">
                  <path d=${Ii} />
                </svg>
              </button>`}
        <div class="grid">
          <div class="title">
            ${this._config.name??o.attributes.friendly_name??e}
          </div>
          <div class="center">
            <cgh-climate-control
              .hass=${t}
              .stateObj=${o}
            ></cgh-climate-control>
          </div>
          <div class="features">
            <cgh-feature-tiles
              .hass=${t}
              .stateObj=${o}
              .tiles=${mt(this._config)}
            ></cgh-feature-tiles>
          </div>
          ${this._renderStatus(t,o)}
        </div>
      </ha-card>
    `:d`<ha-card class="warning"
        >${this.t("card.entity_not_found",{entity:e})}</ha-card
      >`}};be.styles=k`
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
  `,gt([p({attribute:!1})],be.prototype,"hass",2),gt([A()],be.prototype,"_config",2),be=gt([E("climate-group-helper-card")],be),ei({type:"climate-group-helper-card",name:"Climate Group Helper Card",description:"Dial, status and controls for a Climate Group Helper group.",preview:!0})})();
