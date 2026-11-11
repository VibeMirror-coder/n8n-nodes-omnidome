import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeOperationError, NodeConnectionTypes } from 'n8n-workflow';

const ROOT='https://humanmirror.fr';
const PATHS:Record<string,string>={
  cleanJson:'/api/x402/clean-json/',
  safePreflight:'/api/x402/safe-preflight/',
  recover:'/api/payment-rescue/',
};

export class OmniDome implements INodeType {
  description:INodeTypeDescription={
    displayName:'OmniDome by HumanMirror',
    name:'omniDome',
    icon:'file:omnidome.svg',
    group:['transform'],
    version:1,
    subtitle:'={{$parameter["operation"]}}',
    description:'JSON cleanup, advisory agent preflight and safe payment-recovery guidance',
    defaults:{name:'OmniDome'},
    inputs:[NodeConnectionTypes.Main],
    outputs:[NodeConnectionTypes.Main],
    usableAsTool:true,
    properties:[
      {
        displayName:'Operation',name:'operation',type:'options',default:'safePreflight',noDataExpression:true,
        options:[
          {name:'Clean JSON (X402, 0.010 USDC)',value:'cleanJson',description:'Normalize JSON using the current live payment terms',action:'Normalize JSON using the current live payment terms'},
          {name:'Safe Preflight (X402, 0.010 USDC)',value:'safePreflight',description:'Advisory check before a consequential agent action',action:'Advisory check before a consequential agent action'},
          {name:'Recover (Free Advice Only)',value:'recover',description:'Diagnose settlement/delivery uncertainty without recovering funds',action:'Diagnose settlement/delivery uncertainty without recovering funds'},
        ],
      },
      {
        displayName:'Request JSON',name:'requestJson',type:'json',default:'{}',
        description:'JSON sent to the selected API. No private keys or wallet seeds.',
      },
      {
        displayName:'Payment-Signature Header (Optional)',name:'paymentSignature',type:'string',
        default:'',typeOptions:{password:true},
        description:'Paste only a one-request, independently approved x402 payment authorization. Never store seed phrases or authorize automatically.',
        displayOptions:{show:{operation:['cleanJson','safePreflight']}},
      },
    ],
  };

  async execute(this:IExecuteFunctions):Promise<INodeExecutionData[][]>{
    const items=this.getInputData();
    const results:INodeExecutionData[]=[];
    for(let i=0;i<items.length;i++){
      try{
        const op=this.getNodeParameter('operation',i) as string;
        const path=PATHS[op];
        if(!path)throw new NodeOperationError(this.getNode(),'Unsupported operation',{itemIndex:i});
        const raw=this.getNodeParameter('requestJson',i) as string;
        let parsed:unknown;
        try{parsed=JSON.parse(raw)}catch{throw new NodeOperationError(this.getNode(),'Request JSON must be valid JSON',{itemIndex:i});}
        if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new NodeOperationError(this.getNode(),'Request JSON must contain a JSON object',{itemIndex:i});
        const headers:Record<string,string>={'Content-Type':'application/json','Accept':'application/json'};
        if(op!=='recover'){
          const signature=(this.getNodeParameter('paymentSignature',i,'') as string).trim();
          if(signature)headers['PAYMENT-SIGNATURE']=signature;
        }
        const response=await this.helpers.httpRequest({
          method:'POST',
          url:ROOT+path,
          headers,
          body:parsed,
          json:true,
          returnFullResponse:true,
          ignoreHttpStatusErrors:true,
          timeout:30000,
        });
        const status=Number(response?.statusCode||0);
        const payload=response?.body ?? response;
        if(status===402){
          const challenge=response?.headers?.['payment-required']||response?.headers?.['PAYMENT-REQUIRED']||null;
          results.push({json:{ok:false,payment_required:true,status:402,operation:op,endpoint:ROOT+path,challenge:challenge||null,response:payload,notice:'Obtain operator approval for the live x402 terms. No payment was made by this node.'},pairedItem:{item:i}});
          continue;
        }
        if(status>=400)throw new NodeOperationError(this.getNode(),'HumanMirror HTTP '+status+': '+JSON.stringify(payload).slice(0,500),{itemIndex:i});
        results.push({json:{ok:true,operation:op,status,response:payload,advisory_only:op==='recover'},pairedItem:{item:i}});
      }catch(error){
        if(this.continueOnFail()){
          results.push({json:{ok:false,error:error instanceof Error?error.message:String(error)},pairedItem:{item:i}});
        }else{throw new NodeOperationError(this.getNode(),error instanceof Error?error.message:String(error),{itemIndex:i});}
      }
    }
    return [results];
  }
}
