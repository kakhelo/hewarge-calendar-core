const TOKEN_SEQUENCE = ['YYYY','YY','Y','DDDD','MMMM','MMMMM','dddd','ddd','dd','DDD','MMM','DD','MM','SSS','SS','HH','hh','kk','mm','ss','ZZ','WW','zz','M','D','d','ww','w','W','H','h','k','m','s','S','Z','z','A','a'];

export function tokenizeFormat(format) {
  if (typeof format !== 'string') throw new TypeError('Format must be a string.');
  const parts=[]; let i=0;
  while(i<format.length){
    if(format[i]==='['){
      const end=format.indexOf(']',i+1); if(end<0) throw new RangeError(`Unclosed literal bracket at position ${i}.`);
      let content=format.slice(i+1,end).replace(/\\([\[\]])/g,'$1'); parts.push({type:'literal',value:content}); i=end+1; continue;
    }
    if(format[i]==='\\'){
      if(i+1>=format.length) throw new RangeError('Trailing escape character in format.');
      parts.push({type:'literal',value:format[i+1]}); i+=2; continue;
    }
    let matched=null;
    for(const token of TOKEN_SEQUENCE){ if(format.startsWith(token,i)){matched=token;break;} }
    if(matched){parts.push({type:'token',value:matched}); i+=matched.length;}
    else {parts.push({type:'literal',value:format[i]}); i++;}
  }
  return parts;
}

export function validateFormat(format) {
  try { const parts=tokenizeFormat(format); return {valid:true, format, parts, unknownTokens:[]}; }
  catch(error){ return {valid:false, format, parts:[], error:error.message, unknownTokens:[]}; }
}
