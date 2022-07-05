import { v4 as uuid4 } from 'uuid';

const MAX_RECURSION = 2;
const ID_REGEX = /_Id$/m
const LENIENT_UUID_REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
// const UUID_REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
const IS_ID = (key, value) => (
    ID_REGEX.test(key) || 
    (typeof value === 'string' && LENIENT_UUID_REGEX.test(value))
)

export function keyUUID(array, prefix = "", recurse = false, recursions = 0) {
    let ret = array.map((item, index) => {
        if (typeof item === 'object' && !Array.isArray(item)) {
            if (recurse && recursions < MAX_RECURSION) 
                item = handleNestedObject(item, prefix, recurse, recursions + 1);
            else if (Object.entries(item).filter(([key, value]) => IS_ID(key,value)).length < 1) //check if any keys are already a UUID
                item = addKeyToObject(item, prefix);
        } else if (Array.isArray(item) && recurse && recursions < MAX_RECURSION) {
            item = keyUUID(array, index, recurse, recursions + 1);
        } else {
            item = addKeyToPrimitive(item);
        }
        return item;
    })
    return ret
}

//this function mutates the object
export function handleNestedObject(object, prefix="", recurse = false, recursions = 0) {
    if (recurse && recursions < MAX_RECURSION) Object.entries(object).filter(([key, value]) => 
        !IS_ID(key, value) //skip object entries that either have _Id in the key or are a uuid value
    ).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
            object[key] = handleNestedObject(value, key, recurse, recursions + 1) //recurse object
        } else if (Array.isArray(value)) {
            object[key] = keyUUID(value, key, recurse, recursions + 1)
        } 
        // else {
        //     object[key] = addKeyToPrimitive(value)
        // }
    })
    if (Object.entries(object).filter(([key, value]) => 
        IS_ID(key,value) // check if any keys are an ID
        ).length < 1
    ) {
        object = addKeyToObject(object, prefix);
    }
    return object
}

//this function turns a primitive into an object
export function addKeyToPrimitive(value) {
    return {
        value: value,
        Id: uuid4()
    }
}

//this function copies and adds to the object
export function addKeyToObject(object, prefix= "") {
    return {
        ...object,
        [`${prefix}_Id`]: uuid4()
    }
}