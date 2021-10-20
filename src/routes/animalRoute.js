const { Router } = require("express")
const router = Router();

const bcrypt = require('bcrypt') //Encriptación para la generación de contraseña
const jwt = require('jsonwebtoken'); 

var pg = require('pg');

const saltRounds = 10
const connectionString = process.env.POSTGRES_URL;

// CONNECTION TO DATABASE

var client = new pg.Client(connectionString);
client.connect();

// VERIFICATION MIDDLEWARE TOKEN HANDLING

const verify = (req, res, next) => {
    console.log(req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err)=>{
            if(err){
                return res.status(403).json("Token is not valid or expired")
            }
            next();
        })
    } else {
        res.status(401).json("You are not authenticated");
    }
}

// ROUTES FOR ANIMAL DATA HANDLING

router.route("/getAnimals").get(async(req, res, next) =>{
    try {
        const sql = "SELECT animal_id, animals.type_id, types.type_name, name, image_url, sex, age, animals.vet_id, vets.vet_name FROM animals INNER JOIN types ON animals.type_id = types.type_id INNER JOIN vets ON animals.vet_id = vets.vet_id ORDER BY animal_id";
        const result = await client.query(sql);
        return res.status(200).json({
            result: result.rows
        })
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

router.route("/getVets").get(async(req, res, next) =>{
    try {
        const sql = "SELECT * FROM vets ORDER BY vet_id";
        const result = await client.query(sql);
        return res.status(200).json({
            result: result.rows
        })
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

router.route("/getTypes").get(async(req, res, next) =>{
    try {
        const sql = "SELECT * FROM types ORDER BY type_id";
        const result = await client.query(sql);
        return res.status(200).json({
            result: result.rows
        })
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

router.route("/createAnimal").post(verify, async(req, res, next) =>{
    try {
        let type_id = req.body.type_id;
        let name = req.body.name;
        let image_url = req.body.image_url;
        let sex = req.body.sex;
        let age = req.body.age;
        let vet_id = req.body.vet_id;
        const sql = "INSERT INTO animals (type_id, name, image_url, sex, age, vet_id) VALUES($1,$2,$3,$4,$5,$6)";
        const result = await client.query(sql, [type_id, name, image_url, sex, age, vet_id]);
        console.log(result);
        return res.status(200).json({
            message: "Animal created successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

router.route("/updateAnimal/:id").put(verify, async(req, res, next) =>{
    try {
        let animal_id = req.params.id;
        let type_id = req.body.type_id;
        let name = req.body.name;
        let image_url = req.body.image_url;
        let sex = req.body.sex;
        let age = req.body.age;
        const sql = "UPDATE animals SET type_id=$1, name=$2, image_url=$3, sex=$4, age=$5, WHERE animal_id=$6";
        const result = await client.query(sql, [type_id, name, image_url, sex, age, animal_id]);
        return res.status(200).json({
            message: "Animal updated successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

router.route("/assignVet/:id").put(verify, async(req, res, next) =>{
    try {
        let animal_id = req.params.id;
        let vet_id = req.body.vet_id;
        const sql = "UPDATE animals SET vet_id=$1 WHERE animal_id=$2";
        const result = await client.query(sql, [vet_id, animal_id]);
        return res.status(200).json({
            message: "New vet assigned successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

router.route("/deleteAnimal/:id").delete(verify, async(req, res, next) =>{
    try {
        let animal_id = req.params.id;
        const sql = "DELETE FROM animals WHERE animal_id=$1";
        const result = await client.query(sql, [animal_id]);
        return res.status(200).json({
            message: "Animal deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

// ROUTES FOR STAFF DATA HANDLING

router.route("/loginStaff").post(async(req, res, next) =>{
    try {
        let user_name = req.body.user_name;
        let password = req.body.password;
        const sql = "SELECT * FROM staff WHERE user_name = $1";
        const result = await client.query(sql, [user_name]);

        if(result.rowCount === 0){
            res.status(204).json({
                message: 'Username and/or password not valid'
            })
        } else {
            const saltedPassword = result.rows[0].password;
            const successResult = await bcrypt.compare(password, saltedPassword)

            if(successResult === true){
                let token = jwt.sign({
                    data: {
                        user_id: result.rows[0].user_id
                    }
                }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: 60 * 60 * 24 })

                return res.status(200).json({
                    message: "Authentication successfully",
                    token: token
                })
            } else {
                return res.status(204).json({
                    message: "Username and/or password not valid"
                })
            }
        }
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

router.route("/createStaff").post(async(req, res, next) =>{
    try {
        let user_name = req.body.user_name;
        let password = req.body.password;
        const sql = "SELECT * FROM staff WHERE user_name = $1";
        const result = await client.query(sql, [user_name]);

        if(result.rowCount > 0){
            console.log("USERNAME EXISTS")
            res.status(400).json({
                message: 'Username already exists'
            })
        } else {
            const hash = await bcrypt.hash(password, saltRounds)
            const resultReg = await client.query('INSERT INTO staff (user_name, password) VALUES ($1,$2)',
            [user_name, hash]);
            return res.status(200).json({
                message: "New staff registered successfully",
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: "There was an error. Try again later"
        })
    }
})

module.exports = router;