/--------------------------------------------------------------/

What is process.exit()?

    In Node.js, process.exit() is a global function used to terminate the currently running Node.js process. It's a synchronous function, meaning that the process exits immediately after the call is made.

process.exit(code);

Parameters:

    code (optional): An integer value (default: 0) that indicates the exit status of the process.
    0: Indicates successful termination.
    Positive non-zero values: Usually indicate an error or failure.
    Negative values: Reserved for specific operating system signals.

(

    function handleError(err)
    {
        console.error('Error:', err);
        process.exit(1); // Indicate an error
    }

    if (someCondition) {
        process.exit(0); // Indicate successful termination
    }

)

/--------------------------------------------------------------/

Create a .env file in the root of your project:

S3_BUCKET="YOURS3BUCKET"
SECRET_KEY="YOURSECRETKEYGOESHERE"

As early as possible in your application, import and configure dotenv:

require('dotenv').config()
console.log(process.env)

.. or using ES6?

import 'dotenv/config'

/--------------------------------------------------------------/
