const express = require('express')
const path = require('path')
const app = express();
const port = 2507;
const cors =require('cors');
let insertId=0;


const queryString = require('querystring')
const { connection } = require('./public/utils/dbConnection');


app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));




app.use(express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, 'public/views'))
app.use(express.json());

app.listen(port, (err) => {
    if (err)
        console.log(err)
    console.log("Server is running on port 2507")
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "index.html"))
})

app.get("/AllClients", async (req, res) => {
    try {
        let clientList = await getAllClients();
        console.log(clientList.count, "cccccccccccc")
        res.json({"data" :clientList});
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})


app.post("/addClient", async (req, res) => {
    let { name, description, client_id, client_secret } = req.body;
    try {
        let storeStatus = await addClientInDb(name, description, client_id, client_secret);
	if (storeStatus === 200) {
            logActivity("create", name, null);
        }
        res.sendStatus(storeStatus)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get("/getAllProjects", async (req, res) => {
    let { clientId } = req.query;
    console.log(req.body)
    try {
        console.log(clientId)
        let projectList = await getProjectList(clientId);
        console.log(projectList.length)
        for(let project of projectList){
            project.is_valid = (+project.created_time+3600000 )>new Date().getTime();
            project.auto_regeneration=(project.auto_regeneration==1);
            project.created_time= changeTime(project.created_time);
            project.scope_list=project.scopes?project.scopes.split(",") :[];
        }
        res.json({"data" : projectList});
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})

function changeTime(time){
    // console.log(time)
    return new Date(+time).toLocaleString("en-US", {
        dateStyle: "short",
        timeStyle: "short"
      }).toString();
}


app.post("/addProject", async (req, res) => {
    let { name, description, scope, clientId, autoRegeneration } = req.body;
    console.log(req.body)
    try {
        let uniqueStatus = await checkDuplicateProject(name);
        if (uniqueStatus) {
            let id = await createProjectInDb(name, description, scope, clientId, autoRegeneration);
            console.log("ccccccccccccccccccccCC",id)
            if (id) {
                let clientDetails = await getClientDetailsFromDB(clientId);
                // let client_id = clientDetails.client_id
		    logActivity("create", clientDetails.name, name);
                insertId =id;
                console.log("\n\n",id)
                return res.json({"project_id" : insertId});
            }
            return res.sendStatus(404);
        }
       return  res.sendStatus(409);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.get('/newProject', async (req, res) => {
    let code = req.query.code;
    let state = req.query.state;
    console.log(state)
    let clientId=JSON.parse(state).clientId
    let projectId=JSON.parse(state).projectId
    console.log(JSON.parse(state).clientId)
    try {
        let clientDetails = await getClientDetailsFromDB(clientId);
        let tokens = await genrateTokens(code, clientDetails.client_id, clientDetails.client_secret);
        console.log(tokens);
        let createStatus = await createTokenInDB(tokens,projectId==0?insertId:projectId);
        if (createStatus) {
            // return res.redirect("https://pali-client.csez.zohocorpin.com:8000")
            return res.redirect("https://preide.pali.io/")
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

app.get('/getClient', async (req,res)=>{
    let {clientId}= req.query;
    try{
        let clientDetails = await getClientDetailsFromDB(clientId);
        // clientDetails.domain=domains[clientDetails.domain].auth
        res.json({"data" : [clientDetails]})
    }catch(err){
        console.log(err)
        reject(500)
    }
})

app.post('/editClient', async (req, res) => {
    let { name, description, clientId} = req.body;
    console.log(name,description)
    try {
        let updateStatus = await updateClientInDb(name, description, clientId);
        res.sendStatus(updateStatus ? 200 : 404);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/deleteClient", async (req, res) => {
    let { clientId } = req.body;
    try {
        let deleteStatus = await deleteClient(clientId);
        if (deleteStatus) {
	    let clientDetails = await getClientDetailsFromDB(clientId);
            logActivity("delete", clientDetails.name, null);
            return res.sendStatus(200);
        }
        res.sendStatus(404)
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})

app.get("/getProjectsOfClient", async (req, res) => {
    let { clientId } = req.query;
    try {
        let list = await getProjectOfClient(clientId);
        res.json(list);
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})

app.get("/getProject",async (req,res)=>{
    let {projectId} =req.query
    try{
        console.log("projectId",projectId)
        let project= await getProjectDetailsFromDb(projectId)
        console.log(project.created_time)
        project.created_time = changeTime(project.created_time)
        res.json({"data" : [project]});
    }catch(err){
        console.log(err);
        res.sendStatus(500)
    }
})

app.post("/editProject", async (req, res) => {
    let { name, description, auto_regeneration,scopes, project_id } = req.body;
    try {
        console.log(name,description,scopes,project_id)
        let projectDetails = await getProjectDetailsFromDb(project_id);
        let editStatus = updateProjectInDb(name, description, scopes,auto_regeneration, project_id);
        if (editStatus) {
            return res.json({"is_scope_changed": projectDetails.scopes==scopes})
            // return res.json({"is_scope_changed": projectDetails.scopes===scopes?[projectDetails.scopes==scopes]:null})

        }
        res.sendStatus(404)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

// app.post("/editScope",async (req,res)=>{
//     let {projectId,scope} = req.body;
//     try{
//         let updateStatus = await updateScopeInDb(projectId,scope); 
//         if(updateStatus){
//         let projectDetails= await getProjectDetailsFromDb(projectId);
//         let clientDetails = await getClientDetailsFromDB(projectDetails.client_id);
//         res.json(clientDetails.client_id);
//         }
//     }catch(err){
//         console.log(err);
//         reject(500);
//     }
// })


app.post("/deleteProject", async (req, res) => {
    let { project_id } = req.body;
    try {
        let deleteStatus = await deleteProject(project_id);
        if (deleteStatus) {
		let project = await getProjectDetailsFromDb(project_id);
            let client = await getClientDetailsFromDB(project.client_id);
            logActivity("delete", client.name,project.name);
            return res.sendStatus(200)
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})


app.post("/regenerateToken", async (req, res) => {
    let { projectId } = req.body;
    try {
        let tokens = await getTokenFromDb(projectId);
        // console.log(tokens.refresh_token)
        let project = await getProjectDetailsFromDb(projectId);
        // console.log(project)
        let client = await getClientDetailsFromDB(project.client_id);
        // console.log(client.client_id,client)
        let newAccessToken = await regenerateToken(client.client_id, client.client_secret, tokens.refresh_token);
        let updateStatus = await updateAccessToken(tokens.token_id, newAccessToken);
        if (updateStatus) {
            return res.json(newAccessToken);
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

app.get("/allLog",async (req,res)=>{
    try{
   let logs=await getLogFromDb();
   for(l of logs){
    l.time=changeTime(l.time)
    l.project_name=l.project_name || "";
    }
    res.json({"data": logs})
    }catch(err){
    console.log(err)
    res.sendStatus(500)
    }
   })



// ========================== DB


async function getAllClients() {
    let query = "select c.*,count(p.project_id) as project_count from client c left join project p on c.id = p.client_id and p.is_trashed = 0 where c.is_trashed = 0 group by c.id";
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
            if (err) {
                console.log("GET ALL CLIENT FROM DB ERRORn\n", err)
                reject(500)
            }
            resolve(result);
        })
    })
}

async function addClientInDb(name, description, client_id, client_secret) {
    let uniqueStatus = await checkDuplicateClientId(client_id);
    return new Promise((resolve, reject) => {
        if (uniqueStatus) {
            let query = "insert into client (name,description,client_id,client_secret,is_trashed) values (?,?,?,?,0)";
            connection.query(query, [name, description, client_id, client_secret], (err, result) => {
                if (err) {
                    console.log("ADD CLIENT IN DB ERROR\n", err)
                    reject(500);
                }
                if (result.affectedRows === 1) resolve(200);
            })
        }
        else {
            resolve(409);
        }
    })

}

async function checkDuplicateClientId(client_id) {
    let query = "select * from client where client_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [client_id], (err, result) => {
            if (err) {
                console.log("CHECK DUPLICATE CLIENT ID ERROR", err)
                reject(500)
            }
            resolve(result.length == 0);
        })
    })
}

async function getProjectList(client_id) {
    let query = "select * from project p join token t on p.project_id=t.project_id where p.client_id = ? and p.is_trashed=false";
    return new Promise((resolve, reject) => {
        connection.query(query, [client_id], (err, result) => {
            if (err) {
                console.log("GET ALL PROJECT CLIENT ID ERROR\n", err);
                reject(500);
            }
            resolve(result);
        })
    })
}

async function checkDuplicateProject(project) {
    let query = "select * from project where name = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [project], (err, result) => {
            if (err) {
                console.log("CHECK DUPLICATE PROJECT ERROR \n", err);
            }
            resolve(result.length === 0);
        })
    })
}

async function createProjectInDb(name, description, scope, clientId, autoRegeneration) {
    let query = "insert into project (name,description,scopes,auto_regeneration,client_id,is_trashed) values (?,?,?,?,?,0)";
    return new Promise((resolve, reject) => {
        connection.query(query, [name, description, scope, autoRegeneration, clientId], (err, result) => {
            if (err) {
                console.log(" CREATE PROJECT IN Db ERROR", err);
                reject(500);
            }
            console.log("aaaaaaaaaa",result.insertId)
            resolve(result.insertId);
        })
    })
}

async function getClientDetailsFromDB(clientId) {
    let query = "select * from client where id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [clientId], (err, result) => {
            if (err) {
                console.log("GET CLIENT ID FROM DB ERROR \n", err);
                reject(500);
            }
            resolve(result[0]);
        })
    })
}

async function createTokenInDB(token, projectId) {
    console.log("aaaaaaaaaaaa",token,projectId)
    let alreadyExist="select * from token where project_id = ?";
    let query = "insert into token (access_token,refresh_token,created_time,project_id) values (?,?,?,?)";
    let update = "update token set access_token = ?,refresh_token = ?,created_time =? where project_id = ?";
    console.log(token, projectId)
    return new Promise((resolve, reject) => {
        connection.query(alreadyExist,[projectId],(err,result)=>{
        if(err){
            console.log("CREATE TOKEN DUPLICATE CHECK ERROR",err)
            reject(500);
        }
        console.log(result)
        if(result.length==0){
            console.log(token,projectId)
            connection.query(query, [token.access_token, token.refresh_token, `${new Date().getTime()}`, projectId], (err, result) => {
                if (err) {
                    console.log("CREATE TOKEN IN DB ERROR \n", err);
                    reject(500)
                }
                console.log(result)
                resolve(result.affectedRows == 1);
            })
        }else{
            connection.query(update,[token.access_token,token.refresh_token,new Date().getTime(),projectId],(err,result)=>{
                if(err){
                    console.log("UPDATE TOKEN CREATE TOKEN ERR\n",err);
                    reject(500);
                }
                // console.log(result)
                resolve(result.affectedRows>0);
            })
        }
        })
    })
}

async function updateClientInDb(name, description, client_id) {
    let query = "update client set name =?,description = ? where id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [name, description,client_id], (err, result) => {
            if (err) {
                console.log("UPDATE CLIENT IN DB ERROR\n", err)
                reject(500)
            }
            resolve(result.affectedRows == 1);
        })
    })
}

async function deleteClient(clientId) {
    let query = "update client set is_trashed=true where id = ?";
    let trashQuery = "insert into client_trash (deleted_date,client_id) values (?,?)"
    let deleteProject = "update project set is_trashed =1 where client_id = ?"
    
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                console.log("DELETE CLIENT TRANSACTION ERROR", err);
                reject(500);
            }

            connection.query(query, [clientId], (err, result) => {
                if (err) {
                    console.log("DELETE CLIENT UPDATE IS TRASHED ERROR\n", err);
                    return connection.rollback(() => reject(500));
                }
                if (result.affectedRows == 1) {
                    connection.query(trashQuery, [new Date(), clientId], (errr, result2) => {
                        if (errr) {
                            console.log("INSERT IN CLIENT TRASH ERROR \n", errr);
                            return connection.rollback(() => reject(500));
                        }
                        if (result2.affectedRows === 1) {
                            connection.query(deleteProject, [clientId], (err3, result3) => {
                                if (err3) {
                                    console.log("INSERT IN CLIENT TRASH ERROR \n", err3);
                                    return connection.rollback(() => reject(500));
                                }
                                if (result2.affectedRows === 1) {
                                    connection.commit((err4) => {
                                        if (err4) {
                                            console.log("DELETE CLIENT TRANSACTION COMMIT ERROR", err4);
                                            return connection.rollback(() => reject(500));
                                        }
                                        resolve(true);
                                    })
                                } else {
                                    return connection.rollback(() => reject(500))
                                }
                            })   
                        }
                    })
                }
            })
        })
    })
}



async function deleteProject(projectId) {
    let query = "update project set is_trashed =1 where project_id = ?"
    
    return new Promise((resolve, reject) => {
        connection.query(query, [projectId], (err, result) => {
            if (err) {
                console.log("DELETE PROJECT IN DB ERROR", err);
                reject(500);
            }
            resolve(true);
        })
    })
}

async function getProjectOfClient(clientId) {
    let query = "select * from client c join project p on c.id = p.client_id where c.id = ? ";
    return new Promise((resolve, reject) => {
        console.log(clientId+"====")
        connection.query(query, [clientId], (err, result) => {
            if (err) {
                console.log("GET PROJECT OF CLIENT ERROR \N", err);
                reject(500);
            }
            resolve(result);
        })
    })
}

async function updateProjectInDb(name, description, scope,auto_regeneration, project_id) {
    let query = "update project set name=? , description = ?,auto_regeneration=? ,scopes = ? where project_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [name, description, auto_regeneration, scope, project_id], (err, result) => {
            if (err) {
                console.log("UPDATE PROJECT IN DB ERROR", err);
                reject(500);
            }
            resolve(result.affectedRows === 1);
        })
    })
}

// async function updateScopeInDb(projectId,scope){
//     let query="update project set scopes= ? where project_id =?";
//     return new Promise((resolve,reject)=>{
//         connection.query(query,[scope,projectId],(err,result)=>{
//             if(err){
//                 console.log("UPDATE SCOPE IN DB ERR\n",err);
//                 reject(500);
//             }
//             resolve(result.affectedRows===1);
//         })
//     })
// }



async function getTokenFromDb(projectId) {
    let query = "select * from token t join project p on t.project_id = p.project_id where p.is_trashed=false and p.project_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [projectId], (err, result) => {
            if (err) {
                console.log("GET PROJECT DETAIL ERROR", err);
            }
            resolve(result[0]);
        })
    })
}

async function getProjectDetailsFromDb(projectId) {
    let query = "select * from project p join token t on p.project_id = t.project_id where p.project_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [projectId], (err, result) => {
            if (err) {
                console.log("GET PROJECT DETAILS ERR\n", err)
                reject(500);
            }
            // console.log("aaaaaaaaaaaa",result)
            resolve(result[0]);
        })
    })
}

async function updateAccessToken(tokenId, accessToken) {
    let query = "update token set access_token = ?, created_time = ? where token_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [accessToken, new Date().getTime(), tokenId], (err, result) => {
            if (err) {
                console.log("UPDATE ACCESS TOKEN ERROR", err)
                reject(500)
            }
            resolve(result.affectedRows === 1);
        })
    })
}


async function getLogFromDb(){
    let query= "select * from log";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("GET LOG FROM DB ERROR",err)
                reject(500);
            }
            resolve(result)
        })
        
    })
}


async function genrateTokens(grandToken, clientId, clientSecret) {
    console.log(grandToken,clientId,clientSecret)
    let response = await fetch("https://accounts.zoho.in/oauth/v2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: queryString.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: grandToken,
            redirect_uri: "http://localhost:2507/newProject"
        })
    })
    let object = await response.json();
    console.log(object)
    return object;
}

async function regenerateToken(clientId, clientSecret, refreshToken) {
    // console.log("aaaaaaa",clientId, clientSecret, refreshToken)
    let response = await fetch("https://accounts.zoho.in/oauth/v2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: queryString.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken
        })
    })
    let newToken = await response.json();
    console.log(newToken)
    return newToken.access_token;
}

// regenerateToken("1000.79F036M9ZLSBZNO7WRD9DHGIADVPXH","97937691c11c59eab4e7d00e2062332a7fd1cf3f26","1000.8895241e35f7259fca7c1644bf51eb64.f3ee5cf55e0c1aca8264989b0062cf57")

//============================================


function permanentlyDeleteClient(client_id){
    return new Promise((resolve, reject) => {
        const del_client_trash = "delete from client_trash where client_id=?";
        const del_client = "delete from client where id=? and  is_trashed=1";
        const del_project = "delete p,pt from project p join project_trash pt on p.project_id=pt.project_id where p.client_id=?"
        connection.query(del_client_trash, [client_id],(err, result) => {
            if(err){
                console.log("DELETE CLIENT TRANSACTION ERROR\n", err)
                reject(500);
            }
            connection.query(del_client, [client_id],(err, result) => {
                if(err){
                    console.log(err)
                    return connection.rollback(() => reject(500))
                }
                else if(result){
                    connection.query(del_project, [client_id],(err, result) => {
                        if(err){
                            console.log(err)
                            return connection.rollback(() => reject(500))
                        }
                        if(result){
                            connection.commit((err) => {
                                if (err) {
                                    console.log(err);
                                    return connection.rollback(() => reject(500))
                                }
                                resolve(true);
                            })
                        }

                    })
                }
                
            });
            
        })
    });
}

app.post("/permanentlyDeleteClient", async (req, res) => {
    const {id} = req.body;
    console.log("==========")
    console.log(req.body)

    try {
        const result = await permanentlyDeleteClient(id);
        console.log(result)
        res.json({ 
            message: "Client premnanely deleted", 
        });
    } catch (err) {
        res.sendStatus(500);
    }
})
async function restoreClient(trashId) {
    let query = "select client_id from client_trash where trash_id = ?";
    let restoreQuery = "update client set is_trashed= false where id = ?";
    let deleteTrash = "delete from client_trash where client_id = ?";
    let restoreProject = "update project set is_trashed =0 where client_id = ?"
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                console.log("RESTORE CLIENT TRANSACTION ERROR \n", err);
                reject(500);
            }
            console.log("IDDDD: "+trashId)
            connection.query(query, [trashId], (err, result) => {
                if (err) {
                    console.log("RESTORE CLIENT GET CLIENT ID ERR", err);
                    return connection.rollback(() => reject(500));
                
                }
               
                console.log(result)
                let clientDetails=result[0]
                console.log(clientDetails)
                connection.query(restoreQuery, [clientDetails.client_id], (errr, result2) => {
                    if (errr) {
                        console.log("RESTORE CLIENT ERROR\n", errr);
                        return connection.rollback(() => reject(500));
                    }
                    
                    connection.query(deleteTrash, [clientDetails.client_id], (errrr, result3) => {
                        if (errrr) {
                            console.log("DELETE FROM TRASH", errrr);
                            return connection.rollback(() => reject(500));
                        }
                        if (result3.affectedRows === 1) {
                            connection.query(restoreProject, [clientDetails.client_id],(err, result) => {
                                if(err){
                                    console.log(err)
                                    return connection.rollback(() => reject(500))
                                }
                                
                                if(result){
                                    console.log("==========================+++++++++++++++++++")
                                    connection.commit((err) => {
                                        if (err) {
                                            console.log(err);
                                            return connection.rollback(() => reject(500))
                                        }
                                        console.log("IDDDD: "+trashId)
                                        resolve(true);
                                    })
                                }
        
                            })
                        }
                    })
                })
            })
        })
    })
}




app.post("/restoreClient", async (req, res) => {
    console.log("======>came inside restoreClient")
    let {id}  = req.body;
    console.log(id)
    try {
        let restoreStatus = await restoreClient(id);
        
        if (restoreStatus) {
            let clientDetails = await getClientDetailsFromDB(id);
            logActivity("regenerate", clientDetails.name, null);
            return res.sendStatus(200);
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})




function getAllClientTrash() {
    const query = "select * from client_trash ct join client c on c.id=ct.client_id where c.is_trashed=1";
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
            if (err) {
                console.error("ERROR : ", err);
                return reject(err);
            }
            resolve(result);
        });
    });
    
}
app.get("/getAllClientTrash", async (req, res) => {
    try {
        let result = await getAllClientTrash();
        result.forEach((e)=>{e.deleted_date=new Date(e.deleted_date).toLocaleString("en-US", {
            dateStyle: "short",
            timeStyle: "short"
          })});

        res.json({"data":result});
    } catch(err) {
        console.error("Error read all client details from trash:", err);
        res.sendStatus(500);
    }
});


function clearClientTrash() {
    return new Promise((resolve, reject) => {
        // const deleteProjectTrash = "delete from project_trash";
        // const deleteProjects = "delete p,pt from project p join project_trash pt on p.project_id=pt.project_id where p.is_trashed = 1 ";
        const deleteClientTrash = "delete from client_trash";
        const deleteClients = "delete from client where is_trashed = 1";

        connection.beginTransaction(err => {
            if (err) {
                console.error("BEGIN TRANSACTION ERROR", err);
                return reject(500);
            }

            connection.query(deleteClients, (err, result) => {
                if (err) {
                    console.error("CLIENT DELETE ERROR", err);
                    return connection.rollback(() => reject(500));
                }


                connection.query(deleteClientTrash, (err, result) => {
                    if (err) {
                        console.error("CLIENT TRASH DELETE ERROR", err);
                        return connection.rollback(() => reject(500));
                    }

                    connection.commit(commitErr => {
                        if (commitErr) {
                            console.error("COMMIT ERROR", commitErr);
                            return connection.rollback(() => reject(500));
                        }

                        resolve(true);
                    })
                });
            });
        });
    });
}

app.post("/clearClientTrash", async (req, res) => {
    console.log("Cleared!!")
    console.log(req.body)
    try {
        const result = await clearClientTrash();
        console.log(result)
        res.json({ 
            message: "Client trash cleared", 
            deletedRows: result.affectedRows
        });
    } catch (err) {
        res.sendStatus(500);
    }
});


function permanentlyDeleteClient(client_id){
    console.log(client_id)
    return new Promise((resolve, reject) => {
        const del_client_trash = "delete from client_trash where trash_id=?";
        const del_client = "delete from client where id=? and  is_trashed=1";
        const del_project = "delete p,pt from project p join project_trash pt on p.project_id=pt.project_id where p.client_id=?"
        connection.query(del_client_trash, [client_id],(err, result) => {
            if(err){
                console.log("DELETE CLIENT TRANSACTION ERROR\n", err)
                reject(500);
            }
            connection.query(del_client, [client_id],(err, result) => {
                if(err){
                    console.log(err)
                    return connection.rollback(() => reject(500))
                }
                else if(result){
                    connection.query(del_project, [client_id],(err, result) => {
                        if(err){
                            console.log(err)
                            return connection.rollback(() => reject(500))
                        }
                        if(result){
                            connection.commit((err) => {
                                if (err) {
                                    console.log(err);
                                    return connection.rollback(() => reject(500))
                                }
                                resolve(true);
                            })
                        }

                    })
                }
                
            });
            
        })
    });
}

app.post("/permanentlyDeleteClient", async (req, res) => {
    const {id} = req.body;
    console.log("==========")
    console.log(req.body)

    try {
        const result = await permanentlyDeleteClient(id);
        console.log(result)
        res.json({ 
            message: "Client premnanely deleted", 
        });
    } catch (err) {
        res.sendStatus(500);
    }
})
// // console.log(insertId)
// insertId=363
// console.log(insertId)

app.get("/last_week_activity", async (req, res) => {
    try {
        const result = await lastWeekActivity();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

function lastWeekActivity() {
    return new Promise((resolve, reject) => {
        const query = "select action, time from log where time >= date_sub(curdate(), interval weekday(curdate()) + 7 day) and time < date_sub(curdate(), interval weekday(curdate()) day)";

        connection.query(query, (err, result) => {
            if (err) {
                return reject(500);
            }

            const counts = {
                0: { create: 0, delete: 0, regenerate: 0 }, 
                1: { create: 0, delete: 0, regenerate: 0 }, 
                2: { create: 0, delete: 0, regenerate: 0 }, 
                3: { create: 0, delete: 0, regenerate: 0 }, 
                4: { create: 0, delete: 0, regenerate: 0 }, 
                5: { create: 0, delete: 0, regenerate: 0 }, 
                6: { create: 0, delete: 0, regenerate: 0 }  
            };

            for (const row of result) {
                if (!row.time) {
                    continue;
                }

                const dateObj = new Date(row.time);
               

                const dayOfWeek = dateObj.getDay(); // Get the numeric day of the week
                if (counts[dayOfWeek]) {
                    if (row.action == "create") counts[dayOfWeek].create++;
                    if (row.action == "delete") counts[dayOfWeek].delete++;
                    if (row.action == "regenerate") counts[dayOfWeek].regenerate++;
                }
            }

            let maxCreate = 0, maxDelete = 0, maxRegenerate = 0;
            for (const day in counts) {
                if (counts[day].create > maxCreate) maxCreate = counts[day].create;
                if (counts[day].delete > maxDelete) maxDelete = counts[day].delete;
                if (counts[day].regenerate > maxRegenerate) maxRegenerate = counts[day].regenerate;
            }

            const dataArray = [];
            for (const day in counts) {
                const c = maxCreate > 0 ? (counts[day].create / maxCreate) * 100 : 0;
                const d = maxDelete > 0 ? (counts[day].delete / maxDelete) * 100 : 0;
                const r = maxRegenerate > 0 ? (counts[day].regenerate / maxRegenerate) * 100 : 0;

                dataArray.push({
                    day: day,
                    create: Number(c.toFixed(2)),
                    up_create: Number((100 - c).toFixed(2)),
                    delete: Number(d.toFixed(2)),
                    up_delete: Number((100 - d).toFixed(2)),
                    regenerate: Number(r.toFixed(2)),
                    up_regenerate: Number((100 - r).toFixed(2))
                });
            }

            resolve({ data: dataArray });
        });
    });
}
async function get_client_count(){
    const query= "select count(*) as total_clients from client where is_trashed = 0";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("GET client_count FROM DB ERROR",err)
                reject(500);
            }
            resolve(result)
        })
        
    })
}

async function get_project_count(){
    const query= "select count(*) as total_projects from project where is_trashed = 0";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("GET project_count FROM DB ERROR",err)
                reject(500);
            }
            resolve(result)
        })
        
    })
}

async function get_valid_token_count(){
    const query= "select count(*) as valid_tokens from token t join project p on p.project_id = t.project_id where p.is_trashed=0 and t.created_time >= unix_timestamp(now() - interval 1 hour)*1000";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("GET valid_token_count FROM DB ERROR",err)
                reject(500);
            }
            resolve(result)
        })
        
    })
    
}

async function get_expired_token_count(){

    const query= "select count(*) as expired_tokens from token t join project p on p.project_id = t.project_id where p.is_trashed=0 and t.created_time < unix_timestamp(now() - interval 1 hour)*1000";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("GET expired_token_count FROM DB ERROR",err)
                reject(500);
            }
            resolve(result)
        })
        
    })
}



app.get("/getDashboardInfo", async (req, res) => {
    try {
        const client_count = await get_client_count();
        const project_count = await get_project_count();
        const valid_token_count = await get_valid_token_count();
        const expired_token_count = await get_expired_token_count();

        const response = {
            data: [{
                total_clients: client_count[0].total_clients,
                total_projects: project_count[0].total_projects,
                valid_tokens : valid_token_count[0].valid_tokens,
                expired_tokens : expired_token_count[0].expired_tokens

            }]
        };

        res.json(response);

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

function logActivity(action, clientName , projectName ) {
    const query = "insert into log (action, time, client_name, project_name) values (?, now(), ?, ?)";
    connection.query(query, [action, clientName, projectName], (err) => {
        if (err) {
            console.log("log insert error:", err);
        }
    });
}