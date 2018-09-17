const alias = require('module-alias/register');
async function f() {
  const t = (...a) => {console.log(a, Array.isArray(a));};
  t(1,2,3);
}

f().catch(err=>console.error(err));
