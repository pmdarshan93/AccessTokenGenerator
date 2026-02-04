const express=require('express')
const path=require('path')
const app = express();
const port=2507;

const queryString = require('querystring')
const { connection } = require('./public/utils/dbConnection');

app.use(express.static(path.join(__dirname,"public")))
app.set("views", path.join(__dirname, 'public/views'))
app.use(express.json());

app.listen(port,(err)=>{
    if(err)
        console.log(err)
    console.log("Server is running on port 2507")
})

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname, "public", "views", "index.html"))
})

app.get('/getAllProjects',async(req,res)=>{
    try{
        let allProjects = await getAllProjectsFromDb();
        res.json(allProjects)
    }catch(err){
        res.sendStatus(err)
    }
})


app.post("/storeData",async (req,res)=>{
    let {clientId, clientSecret}=req.body
    try{
    let store = await storeDataInDb(clientId,clientSecret);
    let id = await getLength();
    return res.status(200).json(id.length);
    }catch(err){
    return res.sendStatus(err)
    }
})

app.get("/scope",(req,res)=>{
    res.sendFile(path.join(__dirname, "public", "views", "scope.html"))
})

app.post("/getCredentials",async (req,res)=>{
    let {scope,project} = req.body
    try{
    let status = await checkDuplicateInDb(project);
    if(status){
        let updateStatus= await updateScopeInDb(scope,project);
        if(updateStatus){
        let details= await getDetailsFromDb();
        let clientId=details.client_id;
        res.json({"clientId":clientId})
        }
    }else{
        res.sendStatus(409)
    }
    }catch(err){
        res.sendStatus(err)
    }

})


app.post('/getLastGenratedToken',async(req,res)=>{
    res.json(await getDetailsFromDb());
})

app.get("/getToken",async(req,res)=>{
    let code = req.query.code
    let details = await getDetailsFromDb();
    console.log(details)
    // let tokenAlreadyCreated= await verifyAccessToken();
    // if(!tokenAlreadyCreated){
    let tokens=await genrateTokens(code,details.client_id,details.client_secret);
    console.log(tokens);
    try{
    let status= await storeTokensInDb(tokens);
    if(!status){
        res.sendStatus(405);
    }
    }catch(err){
        res.sendStatus(err)
    }
// }
    res.sendFile(path.join(__dirname, "public", "views", "token.html"))
})

app.post('/regenrateAccessToken',async(req,res)=>{
    let {project_name,scope}=req.body;
    try{
    let details = await getDetailsFromDbForProjectAndScope(project_name,scope);
    let token = await genrateAccessToken(details.client_id,details.client_secret,details.refresh_token);
    // let token = "1000.a44553af20eab4ace9bb8a73cd9c9d17.663f1b8ff66bb06427d2d7bcd5bf2af1"
    let update =await  updateAccessTokenInDb(token,project_name,scope);
    console.log(token);
    if(update){
    let details = await getDetailsFromDbForProjectAndScope(project_name,scope);
      return  res.json(details)
    }
    res.sendStatus(500);
    }catch(err){
        res.sendStatus(err);
    }
})


// ========================== DB

async function getAllProjectsFromDb(){
    let query= "select project_name,scope,refresh_token,access_token,created_time from  userTokens";
    return new Promise((resolve,reject)=>{
        connection.query(query, (err,result)=>{
        if(err){
            console.log(err)
            return reject(505)
        }
        resolve(result)
    })
    })
}

async function storeDataInDb(clientId,clientSecret){
    let query = "insert into userTokens ( access_token,refresh_token,client_id,client_secret,created_time)values (?,?,?,?,?)"
    return new Promise((resolve,reject)=>{
        connection.query(query,[null,null,clientId,clientSecret,null],(err,result)=>{
        if(err){
            console.log(err)
            reject(505)
        }
        console.log(result)
        resolve(200)
        // res.redirect('/get_refresh_token')
    })
})
}

async function checkDuplicateInDb(project){
    let query="select * from userTokens where project_name = ?";
    return new Promise((resolve,reject)=>{
        connection.query(query,[project],(err,result)=>{
            if(err){
                console.log(err)
                reject(505)
            }
            resolve(result.length===0)
        })
    })
}

async function updateScopeInDb(scope,project){
    let length=await getLength();
    let query = "update userTokens set scope= ?,project_name = ? where id =?"
    return new Promise((resolve,reject)=>{
        connection.query(query,[scope,project,length.length],(err,result)=>{
        if(err){
            console.log(err);
            reject(505)
        }
        console.log(result)
        resolve(result.affectedRows===1)
    })
    });
}

async function getDetailsFromDb(){
        let ans = await getLength();
        let query = "select * from userTokens where id = ?";
        return new Promise((resolve, reject) =>{
            connection.query(query, [ans.length],(err,result)=>{
            if(err){
                console.log(err)
                return reject(505)
            }
            resolve(result[0])
        })
    })
}

async function storeTokensInDb(tokens){
    let query = "update userTokens set refresh_token = ?, access_token = ?,created_time = ? where id = ?";
    let length = await getLength();
    return new Promise((resolve,reject)=>{
        connection.query(query,[tokens.refresh_token,tokens.access_token,new Date().getTime().toString(),length.length],(err,result)=>{
        if(err){
            console.log(err)
            reject(505)
        }
        console.log(result)
        resolve(result.affectedRows===1)
    })
    })
}

async function getDetailsFromDbForProjectAndScope(project_name,scope){
    let query="select * from userTokens where project_name= ? and scope = ?";
    return new Promise((resolve,reject)=>{
        connection.query(query,[project_name,scope],(err,result)=>{
            if(err){
                console.log(err);
                reject(505);
            }
            console.log(result);
            resolve(result[0]);
        })
    })
}


function getLength(){
    let query = "select count(*) as length from userTokens";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log(err)
                reject(505)
            }
            resolve(result[0])
        })
    })
}

async function verifyAccessToken(){
    let query = "select refresh_token as token from userTokens where id = ?";
    let length = await getLength();
    return new Promise( (resolve,reject)=>{
        connection.query(query,[length.length],(err,result)=>{
            if(err){
                console.log(err)
                reject(505);
            }
            console.log(result)
            resolve(result[0].token!=null)
        })
    })
}

async function updateAccessTokenInDb(token,project_name,scope){
    let query="update  userTokens set access_token = ?,created_time=? where project_name = ? and scope = ?";
    return new Promise ( (resolve, reject)=>{
        connection.query(query,[token,new Date().getTime().toString(),project_name,scope],(err,result)=>{
            if(err){
                console.log(err);
                reject(505);
            }
            console.log(result);
            resolve(result.affectedRows==1);
        })
    })
}

//============================================

async function genrateTokens(grandToken,clientId,clientSecret){
let response = await fetch("https://accounts.zoho.in/oauth/v2/token",{
    method : "POST",
    headers : {
    "Content-Type": "application/x-www-form-urlencoded"
    },
    body :queryString.stringify({
        client_id : clientId,
        client_secret : clientSecret,
        grant_type : "authorization_code",
        code : grandToken,
        redirect_uri : "http://localhost:2507/getToken"
      })
})
let object = await response.json();
return object;
}

async function genrateAccessToken(clientId,clientSecret,refreshToken){
let response = await fetch("https://accounts.zoho.in/oauth/v2/token",{
  method : "POST",
  headers : {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body : queryString.stringify({
    client_id : clientId,
    client_secret : clientSecret,
    grant_type : "refresh_token",
    refresh_token : refreshToken
  })
})
let newToken = await response.json();
console.log(newToken)
return newToken.access_token;
}
