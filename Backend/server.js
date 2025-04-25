const express = require('express');

const app= express();

app.get('/', (req, res)=> {
    res.send('Hello World!')
})

// Start the server on port 5000 (or any available port)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});