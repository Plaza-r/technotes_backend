const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const brcrypt = require('bcrypt')

//@desc Get all users
//@route Get /users 
//@access Privatre auth
const getAllUsers = asyncHandler (async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found'})
    }
    res.json(users)
})

//@desc Create new user
//@route POST /users 
//@access Privatre auth
const createNewUser = asyncHandler (async (req, res) => {
    const { username, password, roles } = req.body
    
    //confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'All fields are required'})
    }
    
    // check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username'})
    }
    //hash password
    const hashedPwd = await brcrypt.hash(password, 10) // salt rounds

    const userObject = { username, "password": hashedPwd, roles}

    // Create and store new user
    const user = await User.create(userObject)

    if (user) {
        res.status(201).json({message: `New user ${username} created`})
    } else {
        res.status(400).json({ message: 'Invaled user data recieved'})
    }
})

//@desc Update a user
//@route PATCh /users 
//@access Privatre auth
const updateUser = asyncHandler (async (req, res) => {
    const { id, username, roles, active, password } = req.body

    //confirm data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields are erquired'})
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ mesage: 'User not found'})
    }

    //check for duplicate
    const duplicate = await User.findOne({ username}).lean().exec()
    // allow update to the original user
    if(duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username'})
    }
    
    //note mongoose document if trie dto se property that dont exist in our model would be rejected, can only be done --continued ->
    //with properties that exist in our model
    user.username = username
    user.roles = roles
    user.active = active
    // did not put password because we do not want to require to send a password update when they update somethin else

    if(password) {
        user.password = await bycrypt.hash(password, 10) // salt rounds
    }
    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated`})
})


//@desc Delete a user
//@route DELETE /users 
//@access Privatre auth
const deleteUser = asyncHandler (async (req, res) => {
    const {id} = req.body

    if (!id) {
        return res.status(400).json({message: 'User ID Required'})
    }

    const notes = await Note.findOne({user: id}).lean().exec()
    if (notes?.length) {
        return res.status(400).json({ message: 'User has assgined notes'})
    }
    const user = await User.findById(id).exec()

    if(!user) {
        return res.status(400).json({message: 'User not found'})
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
    
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}