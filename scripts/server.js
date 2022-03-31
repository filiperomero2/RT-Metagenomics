const express = require('express');
const fs = require('fs');

const interface = process.argv[2];
const port = process.argv[3];

const activateServer = (interface) =>{
    const app = express();

    app.get('/', (req, res) => {
        const HTMLFile = interface + '/index.html';
        if (fs.existsSync(HTMLFile)) {
            app.use(express.static(interface));
            res.sendFile(HTMLFile);
        }else{
            res.send('Your results will soon be available here...refresh in a few moments.')
        }
    })
    
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })

}

activateServer(interface);