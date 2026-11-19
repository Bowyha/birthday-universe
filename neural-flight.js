// Monotone beats with two brief holds and a fast, nonzero exit velocity.
export function neuralProgress(u){
 const times=[0,.15,.31,.39,.57,.69,.76,1],values=[0,.09,.29,.29,.54,.66,.66,1],slopes=[0,1,0,0,1,0,0,2.2];
 u=Math.max(0,Math.min(1,u));let i=0;while(i<times.length-2&&u>times[i+1])i++;
 const span=times[i+1]-times[i],x=(u-times[i])/span,x2=x*x,x3=x2*x;
 return (2*x3-3*x2+1)*values[i]+(x3-2*x2+x)*span*slopes[i]+(-2*x3+3*x2)*values[i+1]+(x3-x2)*span*slopes[i+1];
}

