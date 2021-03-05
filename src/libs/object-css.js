export default function(objCss) {
  let str = ''
  for (let css in objCss) {
    str += objCss[css] ? css : ''
  }
  return str
}
