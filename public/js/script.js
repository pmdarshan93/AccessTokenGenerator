let allProjects;
let scopeList=document.querySelector("#scopeList");

document.addEventListener('DOMContentLoaded',async()=>{
    let request= await fetch("/getAllProjects");
    allProjects =await request.json();
    console.log(allProjects);

    for(let i=0;i<allProjects.length;i++){
        let obj=allProjects[i];
        let row=document.createElement('tr');
        //
        let accessToken=createRow(obj.access_token);
        accessToken.appendChild(createCopyButton());
        //
        let time=createRow(new Date(+obj.created_time).toLocaleString());
        let status=+obj.created_time+3600000>new Date().getTime();
        let valid= createRow(status?"Valid":"Expired");
        valid.classList.add(status?"valid":"expired");
        //
        let regenrate=createRow("");
        let button=document.createElement('button');
        button.innerText="Regenrate";
        button.disabled=status;
        button.addEventListener("click",async(e)=>{
            let children=e.target.parentElement.parentElement.children;
            let response=await fetch('/regenrateAccessToken',{
                method :"POST",
                headers : {
                    "Content-Type" : "Application/json"
                },
                body : JSON.stringify({
                    project_name : children[0].innerText,
                    scope: children[1].innerText
                })
            });
            if(response.status==200){
            let token = await response.json();
            console.log(token);
            children[3].innerText=token.access_token;
            children[3].appendChild(createCopyButton());
            children[4].innerText=new Date(+token.created_time).toLocaleString();
            toggleStatus(valid,true);
            e.target.disabled=true;
            }else{
                console.log(response);
                alert('Error Occured Please Try again');
            }
        })
        regenrate.append(button);
        //
        let scope=createRow(obj.scope);
        let edit=document.createElement("button");
        edit.innerText="EDIT"
        scope.appendChild(edit);
        edit.addEventListener('click',()=>{
          showScopes(obj.scope,obj.project_name);  
        })
        //
        row.append(createRow(obj.project_name),scope,createRow(obj.refresh_token),accessToken,time,valid,regenrate);
        document.querySelector("#allProjects").appendChild(row);
    }
})


function createRow(data){
    let table = document.createElement('td');
        table.innerText=data;
        return table;
}

function createCopyButton(){
    let copy=document.createElement('button');
    copy.innerText="Copy";
    copy.addEventListener('click',(e)=>{
        console.log(e.target.parentElement.innerText.replace("Copy","").trim());
        navigator.clipboard.writeText(e.target.parentElement.innerText.replace("Copy","").trim());
    })
    return copy;
}

function toggleStatus(valid,status){
    valid.innerText=status?"Valid":"Expired";
    valid.classList.remove(!status?"valid":"expired");
    valid.classList.add(status?"valid":"expired");
}

async function storeData(){
    let clientId = document.querySelector("#clientId").value;
    let clientSecret = document.querySelector("#clientSecret").value;
    let request =await fetch('/storeData',{
        method : "POST",
        headers : {
            'Content-Type' : "Application/json"
        },
        body : JSON.stringify({
            "clientId" : clientId,
            "clientSecret" : clientSecret,
        })
    })
    let id = await request.json();
    console.log(request)
    if (request.status==200){
        window.location.href="http://localhost:2507/scope"
    }
    else{
    console.log(request);
    alert("Error occuqired please try again!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
}

function showScopes(scopes,projectName){
    scopeList.classList.remove('hide')
    scopes=scopes.split(",");
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
            scopeList.removeChild(e.target.parentElement);
        })
        scopeList.append(div);
    }
    let btn =document.createElement('button');
    btn.innerText="Genrate Tokens";
    btn.addEventListener("click",(e)=>{
        // console.log(scopes)
        createToken(scopes.join(","),projectName);
    })
    scopeList.append(btn);
}



async function createToken(scope,project){
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

