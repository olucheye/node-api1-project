const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const env = require('dotenv').config();

//@DB: localhost MongoDB
//@desc: posting to localhost
mongoose.connect(process.env.DB_URL, {useNewUrlParser:true,  useUnifiedTopology: true});

const db = mongoose.connection;
db.once('open', ()=> console.log(`Database successfully connected`));

//@CREATE SCHEMA
const userSchema = new mongoose.Schema({
    _id: {
        'type': String,
        'default': shortid.generate
      },
    name: {
        type: String,
        required: true
    },
    bio:{
        type: String,
        required: true
    }
});
//@CREATE USER Model 
const User = mongoose.model('User', userSchema);

//instantiates express for CRUD operations
const app = express()

app.use(express.urlencoded({extended : true}));
app.use(express.json());

//@ ROUTE: POST
//@ desc: Create new users and add them to the DB
app.post('/api/users', (req,res)=>{
    const {name, bio} = req.body;

    //trimming off whitespaces from the textbox
    let trimmedName = name.trim();
    let trimmedBio = bio.trim();

    if(trimmedName ==='' || trimmedBio ===''){
        res.status(400).json({
            success: false,
            errorMessage: "Please provide name and bio for the user."
        });
    }else{
        let newUser = new User({
            _id: shortid.generate(),
            name, bio
        })

        newUser.save()
            .then(user=> res.status(201).json({
                success: true,
                data: user
            }))
            .catch(err=> res.status(400).json({
                success: false,
                errorMessage: "Error: " + err
            }));
    }
});

//@ ROUTE: GET
//@ desc: Fetches all the users stored in the DB
app.get('/api/users', (req,res) => {

    User.find()
        .then(users=>res.status(200).json({
            success: true,
            count: users.length,
            data:users
        }))
        .catch(err=>res.status(500).json({
            success: false,
            errorMessage: "The users information could not be retrieved."
        }));
});

//@ ROUTE: GET SPECIFIC USER
//@ desc: Fetches specific users by ID in the DB
app.get('/api/users/:id', (req,res)=> {
    const {id} = req.params;

    User.findById({ _id: id })
        .then(user=> {
            if(!user){
                res.status(404).json({
                    success: false,
                    errorMessage: "The user with the specified ID does not exist."
                })
            } else {
                res.status(200).json({
                    success: true,
                    data: user
                })
            }
        })
        .catch(err => res.status(500).json({
            success: false,
            errorMessage: "The user information could not be retrieved."
        }));
});

//@ ROUTE: DELETE SPECIFIC USER
//@ desc: Deletes after fetching specific user by ID from the DB
app.delete('/api/users/:id', (req,res)=>{
    const {id} = req.params;

    User.findOneAndDelete({_id:id})
        .then(user => {
            if(!user){
                //if it cannot find the specific user ID, it returns this error
                res.status(404).json({
                    success: false,
                    message: "The user with the specified ID does not exist."
                })
            }else{
                res.status(200).json({
                    success: true,
                    messasge: `${user.name} was successfully deleted`
                })
            }
        })
        .catch(err => res.status(500).json({
            success: false,
            errorMessage: "The user could not be removed"
        }));
});

//@ ROUTE: PUT/UPDATE SPECIFIC USER
//@ desc: Updates user information by first searching for its ID from the DB
app.put('/api/users/:id', (req,res)=>{
    const {id} = req.params;
    const{name, bio} = req.body;

    //trimming off whitespaces from the textbox
    let trimmedName = name.trim();
    let trimmedBio = bio.trim();

    User.findOneAndUpdate(
        {_id : id}, {name: trimmedName, bio: trimmedBio}, {overwrite: true}
    )
        .then(user=> {
            if (!user) {
                //if it cannot find the specific user ID, it returns this error
                res.status(404).json({
                    success: false,
                    message: "The user with the specified ID does not exist."
                })
            }if(user && trimmedName === "" || trimmedBio === ""){
                res.status(400).json({
                    success: false,
                    errorMessage: "Please provide name and bio for the user."
                })
            }else{
                res.status(200).json({
                    success: true,
                    messasge: `${user.name} was successfully updated`,
                    data: user
                })
            }
        })
        .catch(err => res.status(500).json({
            success: false,
            errorMessage: "The user information could not be modified."
        }));
});


//PORT 
const port = (process.env.PORT || 3000)
app.listen(port, ()=> console.log(`Server open and running on Port ${port}`));
