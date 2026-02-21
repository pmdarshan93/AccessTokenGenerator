const express = require('express');
const cors=require('cors')

const app = express();
const PORT = 2507;
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));




const clientsData = {
    data: [
        {
            id: 47,
            name: "TEST",
            description: "",
            client_id: "1000.VLL7E0BBDXDGBV8JAN0FPVV9H179UY",
            client_secret: "e7aa1f4d33d9e8c1dccf0e274c541c09f92536a521",
            is_trashed: 0,
            domain: "https://accounts.zoho.in",
            type: "Server",
            project_count: 17
        },
        {
            id: 51,
            name: "aathesh",
            description: "For athesh ragul trade show",
            client_id: "1000.PYZBKVHC0WNMO5EPOFDYDRVJD20CCR",
            client_secret: "568de9ca9d6fce9c1992f9f3040247ca0bd602c55e",
            is_trashed: 0,
            domain: "https://accounts.zoho.in",
            type: "Server",
            project_count: 3
        },
        {
            id: 54,
            name: "Test for new ide",
            description: "",
            client_id: "1000.1EDEZKV67Y89IP84V5NNOTKDT4HYEQ",
            client_secret: "92f44cd573a9a7eade41d7a88a01fa47b9d83fd40b",
            is_trashed: 0,
            domain: "https://accounts.zoho.in",
            type: "Server",
            project_count: 8
        }
    ]
};

// GET /allClients endpoint
app.get('/allClients', (req, res) => {
    res.status(200).json(clientsData);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

     
     
    const projectsData = {
    data: [
    {
    project_id: 282,
    name: "Cliq",
    description: "",
    scopes: "ZohoCliq.webhooks.CREATE",
    auto_regeneration: false,
    is_trashed: 0,
    client_id: 47,
    token_id: 36,
    access_token: "1000.f1bd0eeae7433d6a743e9585e73ce478.987b117f12d547ec41adfd340daa3b18",
    refresh_token: "1000.a4f0f28594438d5a6c68c680e7f8054d.f2200d0ff40ec1cc3e44b4ba7f827a9a",
    created_time: "2/20/26, 2:08 PM",
    is_valid: false,
    scope_list: ["ZohoCliq.webhooks.CREATE"]
    },
    {
    project_id: 284,
    name: "Test for info",
    description: "checking alert for edit",
    scopes: "ZohoCliq.webhooks.CREATE,ZohoCliq.Messages.READ",
    auto_regeneration: false,
    is_trashed: 0,
    client_id: 47,
    token_id: 37,
    access_token: "1000.dfe7d76350390726ac931ae523f7b980.41aecb6ed36cdd65dba78aebebfbe838",
    refresh_token: "1000.731327fd323546464095ae63f5aee710.2c1db180dd9965d3c58544c402d900a0",
    created_time: "2/20/26, 2:11 PM",
    is_valid: false,
    scope_list: [
    "ZohoCliq.webhooks.CREATE",
    "ZohoCliq.Messages.READ"
    ]
    },
    {
    project_id: 285,
    name: "READ MESsages",
    description: "",
    scopes: "ZohoCliq.Messages.WRIT",
    auto_regeneration: false,
    is_trashed: 0,
    client_id: 47,
    token_id: 38,
    access_token: "1000.dce3e11c442238e97ed3c9746364516f.6cab20d058c0979f7318eb2bbc572e86",
    refresh_token: "1000.ef606ab0f2fa9ca43b22cd6b58ee04f5.9ed1eaf69a423a208f00ba047fd8a073",
    created_time: "2/20/26, 3:49 PM",
    is_valid: false,
    scope_list: ["ZohoCliq.Messages.WRIT"]
    },
    {
    project_id: 308,
    name: "abcedh",
    description: "",
    scopes: "ZohoCliq.webhooks.CREATE",
    auto_regeneration: false,
    is_trashed: 0,
    client_id: 47,
    token_id: 41,
    access_token: "1000.f2821381de68b6bc39f438d04d479da6.50bc4f34fb6aad1b2b37bef2088ae460",
    refresh_token: "1000.f42ca2a9e58eaa711f72c2dcb1c6afcd.f0cec655a68446171012d9e172c59f40",
    created_time: "2/20/26, 4:42 PM",
    is_valid: false,
    scope_list: ["ZohoCliq.webhooks.CREATE"]
    }
    ]
    };
     
    
    const singleClientData = {
    data: [
    {
    id: 47,
    name: "TEST",
    description: "",
    client_id: "1000.VLL7E0BBDXDGBV8JAN0FPVV9H179UY",
    client_secret: "e7aa1f4d33d9e8c1dccf0e274c541c09f92536a521",
    is_trashed: 0,
    domain: "https://accounts.zoho.in",
    type: "Server"
    }
    ]
    };
     
    
    app.get('/client', (req, res) => {
    res.status(200).json(singleClientData);
    });

    app.get('/allProjects', (req, res) => {
        res.status(200).json(projectsData);
        });app.get('/allProjects', (req, res) => {
            res.status(200).json(projectsData);
            });