const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    console.log("Checking Authentication");
    try {
        const token = req.headers.authorization.split(" ")[1];
        const verify = jwt.verify(token, '9263d55f3cf9fff7fe039ce6f40c8dbf0a0f6d7f4e10a734f779dd4c768ea3f5c7dd143442ef2ae45592a4a374b8bdf4b52313d16e6a0c8a121fe351f915e8c0');
        if (verify.role == 'hr') {
            next();
        }
        else if (verify.role == 'admin') {
            next();
        }
        else {
            console.log("you are not admin")

            return res.status(401).json({
                msg: 'Only Admin And HR Can Access This Page.'

            })

        }
    }
    catch (error) {
        return res.status(401).json({
            msg: 'invalid token'
        })
    }
}