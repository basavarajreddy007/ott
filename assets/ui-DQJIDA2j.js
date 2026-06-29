import{r as c,R as E}from"./vendor-Ij8kCleH.js";var Y={exports:{}},N={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var te=Symbol.for("react.transitional.element"),re=Symbol.for("react.fragment");function B(e,t,r){var a=null;if(r!==void 0&&(a=""+r),t.key!==void 0&&(a=""+t.key),"key"in t){r={};for(var o in t)o!=="key"&&(r[o]=t[o])}else r=t;return t=r.ref,{$$typeof:te,type:e,key:a,ref:t!==void 0?t:null,props:r}}N.Fragment=re;N.jsx=B;N.jsxs=B;Y.exports=N;var Xe=Y.exports;let ae={data:""},ie=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||ae},oe=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,se=/\/\*[^]*?\*\/|  +/g,M=/\n+/g,x=(e,t)=>{let r="",a="",o="";for(let s in e){let i=e[s];s[0]=="@"?s[1]=="i"?r=s+" "+i+";":a+=s[1]=="f"?x(i,s):s+"{"+x(i,s[1]=="k"?"":t)+"}":typeof i=="object"?a+=x(i,t?t.replace(/([^,])+/g,n=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):s):i!=null&&(s=s[1]=="-"?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=x.p?x.p(s,i):s+":"+i+";")}return r+(t&&o?t+"{"+o+"}":o)+a},h={},G=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+G(e[r]);return t}return e},ne=(e,t,r,a,o)=>{let s=G(e),i=h[s]||(h[s]=(l=>{let d=0,p=11;for(;d<l.length;)p=101*p+l.charCodeAt(d++)>>>0;return"go"+p})(s));if(!h[i]){let l=s!==e?e:(d=>{let p,u,m=[{}];for(;p=oe.exec(d.replace(se,""));)p[4]?m.shift():p[3]?(u=p[3].replace(M," ").trim(),m.unshift(m[0][u]=m[0][u]||{})):m[0][p[1]]=p[2].replace(M," ").trim();return m[0]})(e);h[i]=x(o?{["@keyframes "+i]:l}:l,r?"":"."+i)}let n=r&&h.g;return r&&(h.g=h[i]),((l,d,p,u)=>{u?d.data=d.data.replace(u,l):d.data.indexOf(l)===-1&&(d.data=p?l+d.data:d.data+l)})(h[i],t,a,n),i},le=(e,t,r)=>e.reduce((a,o,s)=>{let i=t[s];if(i&&i.call){let n=i(r),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;i=l?"."+l:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return a+o+(i??"")},"");function _(e){let t=this||{},r=e.call?e(t.p):e;return ne(r.unshift?r.raw?le(r,[].slice.call(arguments,1),t.p):r.reduce((a,o)=>Object.assign(a,o&&o.call?o(t.p):o),{}):r,ie(t.target),t.g,t.o,t.k)}let U,I,A;_.bind({g:1});let v=_.bind({k:1});function ce(e,t,r,a){x.p=t,U=e,I=r,A=a}function w(e,t){let r=this||{};return function(){let a=arguments;function o(s,i){let n=Object.assign({},s),l=n.className||o.className;r.p=Object.assign({theme:I&&I()},n),r.o=/go\d/.test(l),n.className=_.apply(r,a)+(l?" "+l:"");let d=e;return e[0]&&(d=n.as||e,delete n.as),A&&d[0]&&A(n),U(d,n)}return o}}var ue=e=>typeof e=="function",C=(e,t)=>ue(e)?e(t):e,de=(()=>{let e=0;return()=>(++e).toString()})(),Z=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),pe=20,R="default",q=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(i=>i.id===t.toast.id?{...i,...t.toast}:i)};case 2:let{toast:a}=t;return q(e,{type:e.toasts.find(i=>i.id===a.id)?1:0,toast:a});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(i=>i.id===o||o===void 0?{...i,dismissed:!0,visible:!1}:i)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(i=>i.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(i=>({...i,pauseDuration:i.pauseDuration+s}))}}},P=[],J={toasts:[],pausedAt:void 0,settings:{toastLimit:pe}},b={},Q=(e,t=R)=>{b[t]=q(b[t]||J,e),P.forEach(([r,a])=>{r===t&&a(b[t])})},V=e=>Object.keys(b).forEach(t=>Q(e,t)),me=e=>Object.keys(b).find(t=>b[t].toasts.some(r=>r.id===e)),z=(e=R)=>t=>{Q(t,e)},fe={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},ye=(e={},t=R)=>{let[r,a]=c.useState(b[t]||J),o=c.useRef(b[t]);c.useEffect(()=>(o.current!==b[t]&&a(b[t]),P.push([t,a]),()=>{let i=P.findIndex(([n])=>n===t);i>-1&&P.splice(i,1)}),[t]);let s=r.toasts.map(i=>{var n,l,d;return{...e,...e[i.type],...i,removeDelay:i.removeDelay||((n=e[i.type])==null?void 0:n.removeDelay)||(e==null?void 0:e.removeDelay),duration:i.duration||((l=e[i.type])==null?void 0:l.duration)||(e==null?void 0:e.duration)||fe[i.type],style:{...e.style,...(d=e[i.type])==null?void 0:d.style,...i.style}}});return{...r,toasts:s}},ge=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||de()}),O=e=>(t,r)=>{let a=ge(t,e,r);return z(a.toasterId||me(a.id))({type:2,toast:a}),a.id},f=(e,t)=>O("blank")(e,t);f.error=O("error");f.success=O("success");f.loading=O("loading");f.custom=O("custom");f.dismiss=(e,t)=>{let r={type:3,toastId:e};t?z(t)(r):V(r)};f.dismissAll=e=>f.dismiss(void 0,e);f.remove=(e,t)=>{let r={type:4,toastId:e};t?z(t)(r):V(r)};f.removeAll=e=>f.remove(void 0,e);f.promise=(e,t,r)=>{let a=f.loading(t.loading,{...r,...r==null?void 0:r.loading});return typeof e=="function"&&(e=e()),e.then(o=>{let s=t.success?C(t.success,o):void 0;return s?f.success(s,{id:a,...r,...r==null?void 0:r.success}):f.dismiss(a),o}).catch(o=>{let s=t.error?C(t.error,o):void 0;s?f.error(s,{id:a,...r,...r==null?void 0:r.error}):f.dismiss(a)}),e};var be=1e3,ve=(e,t="default")=>{let{toasts:r,pausedAt:a}=ye(e,t),o=c.useRef(new Map).current,s=c.useCallback((u,m=be)=>{if(o.has(u))return;let y=setTimeout(()=>{o.delete(u),i({type:4,toastId:u})},m);o.set(u,y)},[]);c.useEffect(()=>{if(a)return;let u=Date.now(),m=r.map(y=>{if(y.duration===1/0)return;let j=(y.duration||0)+y.pauseDuration-(u-y.createdAt);if(j<0){y.visible&&f.dismiss(y.id);return}return setTimeout(()=>f.dismiss(y.id,t),j)});return()=>{m.forEach(y=>y&&clearTimeout(y))}},[r,a,t]);let i=c.useCallback(z(t),[t]),n=c.useCallback(()=>{i({type:5,time:Date.now()})},[i]),l=c.useCallback((u,m)=>{i({type:1,toast:{id:u,height:m}})},[i]),d=c.useCallback(()=>{a&&i({type:6,time:Date.now()})},[a,i]),p=c.useCallback((u,m)=>{let{reverseOrder:y=!1,gutter:j=8,defaultPosition:F}=m||{},T=r.filter(g=>(g.position||F)===(u.position||F)&&g.height),ee=T.findIndex(g=>g.id===u.id),L=T.filter((g,S)=>S<ee&&g.visible).length;return T.filter(g=>g.visible).slice(...y?[L+1]:[0,L]).reduce((g,S)=>g+(S.height||0)+j,0)},[r]);return c.useEffect(()=>{r.forEach(u=>{if(u.dismissed)s(u.id,u.removeDelay);else{let m=o.get(u.id);m&&(clearTimeout(m),o.delete(u.id))}})},[r,s]),{toasts:r,handlers:{updateHeight:l,startPause:n,endPause:d,calculateOffset:p}}},he=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,xe=v`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,we=v`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,Ee=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${he} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${xe} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${we} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,Oe=v`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,je=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${Oe} 1s linear infinite;
`,ke=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,Pe=v`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Ce=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ke} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Pe} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,$e=w("div")`
  position: absolute;
`,De=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Ne=v`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,_e=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Ne} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ze=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return t!==void 0?typeof t=="string"?c.createElement(_e,null,t):t:r==="blank"?null:c.createElement(De,null,c.createElement(je,{...a}),r!=="loading"&&c.createElement($e,null,r==="error"?c.createElement(Ee,{...a}):c.createElement(Ce,{...a})))},Te=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Se=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ie="0%{opacity:0;} 100%{opacity:1;}",Ae="0%{opacity:1;} 100%{opacity:0;}",Re=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Fe=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Le=(e,t)=>{let r=e.includes("top")?1:-1,[a,o]=Z()?[Ie,Ae]:[Te(r),Se(r)];return{animation:t?`${v(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${v(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Me=c.memo(({toast:e,position:t,style:r,children:a})=>{let o=e.height?Le(e.position||t||"top-center",e.visible):{opacity:0},s=c.createElement(ze,{toast:e}),i=c.createElement(Fe,{...e.ariaProps},C(e.message,e));return c.createElement(Re,{className:e.className,style:{...o,...r,...e.style}},typeof a=="function"?a({icon:s,message:i}):c.createElement(c.Fragment,null,s,i))});ce(c.createElement);var He=({id:e,className:t,style:r,onHeightUpdate:a,children:o})=>{let s=c.useCallback(i=>{if(i){let n=()=>{let l=i.getBoundingClientRect().height;a(e,l)};n(),new MutationObserver(n).observe(i,{subtree:!0,childList:!0,characterData:!0})}},[e,a]);return c.createElement("div",{ref:s,className:t,style:r},o)},We=(e,t)=>{let r=e.includes("top"),a=r?{top:0}:{bottom:0},o=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:Z()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...a,...o}},Ye=_`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,k=16,Ke=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:a,children:o,toasterId:s,containerStyle:i,containerClassName:n})=>{let{toasts:l,handlers:d}=ve(r,s);return c.createElement("div",{"data-rht-toaster":s||"",style:{position:"fixed",zIndex:9999,top:k,left:k,right:k,bottom:k,pointerEvents:"none",...i},className:n,onMouseEnter:d.startPause,onMouseLeave:d.endPause},l.map(p=>{let u=p.position||t,m=d.calculateOffset(p,{reverseOrder:e,gutter:a,defaultPosition:t}),y=We(u,m);return c.createElement(He,{id:p.id,key:p.id,onHeightUpdate:d.updateHeight,className:p.visible?Ye:"",style:y},p.type==="custom"?C(p.message,p):o?o(p):c.createElement(Me,{toast:p,position:u}))}))},et=f,X={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},H=E.createContext&&E.createContext(X),Be=["attr","size","title"];function Ge(e,t){if(e==null)return{};var r,a,o=Ue(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(a=0;a<s.length;a++)r=s[a],t.indexOf(r)===-1&&{}.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}function Ue(e,t){if(e==null)return{};var r={};for(var a in e)if({}.hasOwnProperty.call(e,a)){if(t.indexOf(a)!==-1)continue;r[a]=e[a]}return r}function $(){return $=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var a in r)({}).hasOwnProperty.call(r,a)&&(e[a]=r[a])}return e},$.apply(null,arguments)}function W(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(o){return Object.getOwnPropertyDescriptor(e,o).enumerable})),r.push.apply(r,a)}return r}function D(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?W(Object(r),!0).forEach(function(a){Ze(e,a,r[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):W(Object(r)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(r,a))})}return e}function Ze(e,t,r){return(t=qe(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function qe(e){var t=Je(e,"string");return typeof t=="symbol"?t:t+""}function Je(e,t){if(typeof e!="object"||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var a=r.call(e,t);if(typeof a!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function K(e){return e&&e.map((t,r)=>E.createElement(t.tag,D({key:r},t.attr),K(t.child)))}function tt(e){return t=>E.createElement(Qe,$({attr:D({},e.attr)},t),K(e.child))}function Qe(e){var t=r=>{var{attr:a,size:o,title:s}=e,i=Ge(e,Be),n=o||r.size||"1em",l;return r.className&&(l=r.className),e.className&&(l=(l?l+" ":"")+e.className),E.createElement("svg",$({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},r.attr,a,i,{className:l,style:D(D({color:e.color||r.color},r.style),e.style),height:n,width:n,xmlns:"http://www.w3.org/2000/svg"}),s&&E.createElement("title",null,s),e.children)};return H!==void 0?E.createElement(H.Consumer,null,r=>t(r)):t(X)}export{Ke as F,tt as G,Xe as j,et as z};
