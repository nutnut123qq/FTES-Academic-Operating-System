import { JSDOM } from "jsdom"
const dom=new JSDOM("<!DOCTYPE html><body></body>",{pretendToBeVisual:true})
globalThis.window=dom.window; globalThis.document=dom.window.document
const p=dom.window.SVGElement.prototype; p.getBBox=()=>({x:0,y:0,width:100,height:20}); p.getComputedTextLength=()=>100; p.getPointAtLength=()=>({x:0,y:0}); p.getTotalLength=()=>100
const mermaid=(await import("mermaid")).default
const WITH=`flowchart TD\n  subgraph C ["x"]\n   direction TB\n   M0["master 0<br/>slots 0-5460"]\n  end\n  A["a"]\n  A-->M0`
const WO  =`flowchart TD\n  subgraph C ["x"]\n   direction TB\n   M0["master 0 slots 0-5460"]\n  end\n  A["a"]\n  A-->M0`
for(const [k,c] of [["WITH <br/>",WITH],["WITHOUT",WO]]){
  mermaid.initialize({startOnLoad:false,securityLevel:"strict"})
  try{ await mermaid.parse(c); let r="parse OK"; try{await mermaid.render("x-"+k.replace(/\W/g,''),c); r+=", render OK"}catch(e){r+=", RENDER FAIL: "+String(e.message).split("\n")[0]} console.log(k+" -> "+r) }
  catch(e){ console.log(k+" -> PARSE FAIL: "+String(e.message||e).split("\n")[0]) }
}
