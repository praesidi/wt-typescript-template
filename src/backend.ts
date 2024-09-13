//=include ./modules/test_module.ts

import { Test } from './modules/test_module'

const DEV_MODE = customWebTemplate.access.enable_anonymous_access;

if (DEV_MODE) {
	// Для тестирования, шаблон должен быть анонимным.
	Request.AddRespHeader('Access-Control-Allow-Origin', '*', false)
	Request.AddRespHeader('Access-Control-Expose-Headers', 'Error-Message')
	Request.AddRespHeader('Access-Control-Allow-Headers', 'origin, content-type, accept')
	Request.AddRespHeader('Access-Control-Allow-Credentials', 'true')
}

Request.RespContentType = 'application/json'
Request.AddRespHeader('Content-Security-Policy', "frame-ancestors 'self'")
Request.AddRespHeader('X-XSS-Protection', '1')
Request.AddRespHeader('X-Frame-Options', 'SAMEORIGIN')

/* --- types --- */
interface IError {
	code: number
	message: string
}

/* --- utils --- */
function getParam(name: string) {
	return tools_web.get_web_param(curParams, name, undefined, 0)
}

/**
 * Выбирает все записи sql запроса
 * @param {string} query - sql-выражение
 */
function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`))
}

/**
 * Выбирает первую запись sql запроса
 * @param {string} query - sql-выражение
 * @param {any} defaultObj - значение по умолчанию
 */
function selectOne<T>(query: string, defaultObj: any = undefined) {
	return ArrayOptFirstElem<T>(tools.xquery(`sql: ${query}`), defaultObj)
}

/**
 * Создает поток ошибки с объектом error
 * @param {object} errorObject - объект ошибки
 */
function HttpError(errorObject: IError) {
	throw new Error(EncodeJson(errorObject))
}

/* --- global --- */
const curUserId: number = DEV_MODE
	? OptInt('7000000000000000')
	: OptInt(Request.Session.Env.curUserID)
const curUser: CollaboratorDocumentTopElem = DEV_MODE
	? tools.open_doc<CollaboratorDocument>(curUserId).TopElem
	: Request.Session.Env.curUser

/* --- logic --- */
function getColls() {
	return selectAll<CollaboratorCatalogDocumentTopElem>('select * from collaborators')
}

function getDepartments() {
	return selectAll<SubdivisionCatalogDocumentTopElem>('select * from subdivisions')
}

function handler(body: object, method: string) {
	if (method === 'getColls') return getColls()

	if (method === 'getDepartments') return getDepartments()
}

/* --- start point --- */
function main(req: Request, res: Response) {
	try {
		Test()

		const array: Array<any>[] = []

		const body = req.Query
		//const body = tools.read_object(req.Body)
		const method = tools_web.convert_xss(body.GetOptProperty('method'))

		if (method === undefined) {
			throw HttpError({
				code: 400,
				message: 'unknown method',
			})
		}

		const payload = handler(body, method)

		res.Write(tools.object_to_text(payload, 'json'))
	} catch (error) {
		const errorObject = tools.read_object(error)
		Request.RespContentType = 'application/json'
		Request.SetRespStatus(errorObject.GetOptProperty('code', 500), '')
		Response.Write(errorObject.GetOptProperty('message', error))
	}
}

main(Request, Response)

export { }
