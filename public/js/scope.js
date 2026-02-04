let scopeInput=document.querySelector("#scope");
let project = document.querySelector("#projectName");
let scopeList=document.querySelector("#scopeList");
function showScopes(){
    scopeList.classList.remove('hide')
    let scopes=scopeInput.value.split(",");
    console.log(scopes);
    for(let scope of scopes){
        let div = document.createElement('div');
        div.innerText=scope;
        let remove = document.createElement('p');
        remove.innerText="X";
        div.append(remove);
        remove.addEventListener("click",(e)=>{
            console.log(e.target.parentElement.firstChild.textContent);
            scopes=scopes.filter(ele=>ele!=e.target.parentElement.firstChild.textContent);
            scopeList.removeChild(e.target);
        })
        scopeList.append(div);
    }
    let btn =document.createElement('button');
    btn.innerText="Genrate Tokens";
    btn.addEventListener("click",(e)=>{
        createToken();
    })
    scopeList.append(btn);
}


async function createToken(){
    let scope=scopeInput.value
    let details = await fetch("/getCredentials",{
        method : "POST",
        headers :{
            'Content-Type' : "Application/json"
        },
        body : JSON.stringify({
            "scope" : scope,
            "project" : project.value
        })
    })
    if(details.status==200){
    let token=await details.json();
    console.log(token)
    window.location.href=`https://accounts.zoho.in/oauth/v2/auth?response_type=code&client_id=${token.clientId}&scope=${scope}&redirect_uri=http://localhost:2507/getToken&access_type=offline&prompt=consent`
    }
} 

