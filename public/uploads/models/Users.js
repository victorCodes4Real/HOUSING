import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique:true},
    email:{type: String, required: true, unique:true, lowercase: true},
    firstName: {type: String, required: true},
    lastName:{type: String, required:true},
    gender:{type: String, required:true},
    dob:{type: Date, required:true},
    age:{type: Number, },
    phone:{type: String, },
    password:{type: String, required:true},
    imageUrl:{type: String}
});

const User = mongoose.model('User', userSchema);
export default User;