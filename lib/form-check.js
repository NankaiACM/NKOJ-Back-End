const router = require('express').Router()
const {check}=require('express-validator/check')
const default_rules = {
    l: check('l'),
    r: check('r').toInt().isInt().withMessage('not an integer'),
    id:check('id').exists().withMessage('not exist').toInt().isInt().withMessage('not an integer'),
    title:check('title').isLength({max:30}).withMessage(' length < 30 '),
    role_description:check('description').isLength({max:255}).withMessage('length < 255'),
    role_title:check('title').isLength({max:16}).withMessage('length < 16'),
    password:check('password').isLength({min:6,max:13}).withMessage('6 < length < 13'),
    school:check('school').isLength({max:80}).withMessage('length < 80'),
    pid:check('pid'),
    cases:check('cases'),
    time_limit:check('time_limit'),
    memory_limit:check('memory_limit'),
    type:check('type'),
    special_judge:check('special_judge'),
    detail_judge:check('detail_judge'),
    tags:check('tags'),
    level:check('level'),
    description:check('description').exists().withMessage('not exist'),
    input:check('input').exists().withMessage('not exist'),
    output:check('output').exists().withMessage('not exist'),
    sample_input:check('sample_input').exists().withMessage('not exist'),
    sample_output:check('sample_output').exists().withMessage('not exist'),
    hint:check('hint').exists().withMessage('not exist'),
    problems:check('problems').exists().withMessage('not exist'),
    start:check('start').exists().withMessage('not exist'),
    end:check('end').exists().withMessage('not exist'),
    nickname:check('nickname').not().isEmail().toInt().not().isInt().withMessage('could not be pure number or something like an email address').isLength({min:3,max:20}).withMessage('3 < length < 20'),
    email:check('email').isEmail().withMessage('not an email'),
    words:check('words').exists().withMessage('not exist'),
    count:check('count').toInt().isInt().withMessage('not an integer'),
    queryleft:check('queryleft').toInt().isInt().withMessage('not an integer'),
    queryright:check('queryright').toInt().isInt().withMessage('not an integer'),
    solutionId:check('solutionId').toInt().isInt().withMessage('not an integer'),
    problemId:check('problemId').toInt().isInt().withMessage('not an integer'),
    user:check('user').exists().withMessage('not exist').customSanitizer((val)=>{val=val.toLowerCase(); return val}),
    problem_id:check('problem_id').toInt().isInt().withMessage('not an integer'),
    gender:check('gender').toInt().isInt().withMessage('not an integer').custom((val)=>{return val in [0,1,2,3]}).withMessage('not between 0-3')
}


module.exports = default_rules
