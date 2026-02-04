document.addEventListener('DOMContentLoaded',async()=>{
    let response = await fetch('getLastGenratedToken',{
        method : "POST",
        headers :{
            'Content-Type' : "Application/json"
        }
    })
    if(response.status==200){
    let tokens=await response.json();
    console.log(tokens)
    document.querySelector("#accessToken").innerText= JSON.stringify(tokens);
    }else{
        alert("Error occuquired please try again");
    }
})