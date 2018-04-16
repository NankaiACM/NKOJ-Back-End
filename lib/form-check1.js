const router = require('express').Router()
const {checkSchema,validationResult,check}=require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter');
const default_rules = {
    l: check('l'),
    r: check('r').toInt().isInt().withMessage('not an integer'),
    id:check('id').exists().withMessage('not exist').toInt().isInt().withMessage('not an integer'),
    title:check('title').isLength({max:30}).withMessage(' length <= 30 '),
    role_description:check('description').isLength({max:255}).withMessage('length < 255'),
    role_title:check('title').isLength({max:16}).withMessage('length < 16'),
    password:check('password').isLength({min:6,max:13}).withMessage('6 < length < 13'),
    school:check('school').isLength({max:80}).withMessage('length < 80'),
    pid:check('pid').exists().withMessage('not exist'),
    cases:check('cases').exists().withMessage('not exist'),
    time_limit:check('time_limit').exists().withMessage('not exist'),
    memory_limit:check('memory_limit').exists().withMessage('not exist'),
    type:check('type').exists().withMessage('not exist'),
    special_judge:check('special_judge').exists().withMessage('not exist'),
    detail_judge:check('detail_judge').exists().withMessage('not exist'),
    tags:check('tags').exists().withMessage('not exist'),
    level:check('level').exists().withMessage('not exist'),
    description:check('description').exists().withMessage('not exist'),
    input:check('input').exists().withMessage('not exist'),
    output:check('output').exists().withMessage('not exist'),
    sample_input:check('sample_input').exists().withMessage('not exist'),
    sample_output:check('sample_output').exists().withMessage('not exist'),
    hint:check('hint').exists().withMessage('not exist'),
    problems:check('problems').exists().withMessage('not exist'),
    start:check('start').exists().withMessage('not exist'),
    end:check('end').exists().withMessage('not exist'),
    nickname:check('nickname').not().isEmail().not().toInt().isInt().withMessage('could not be pure number or something like an email address').isLength({min:3,max:20}).withMessage('3 < length < 20'),
    email:check('email').isEmail().withMessage('not an email'),
    words:check('words').exists().withMessage('not exist'),
    count:check('count').toInt().isInt().withMessage('not an integer'),
    queryleft:check('queryleft').toInt().isInt().withMessage('not an integer'),
    queryright:check('queryright').toInt().isInt().withMessage('not an integer'),
    solutionId:check('solutionId').toInt().isInt().withMessage('not an integer'),
    problemId:check('problemId').toInt().isInt().withMessage('not an integer')
}


module.exports = default_rules
