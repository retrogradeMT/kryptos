import { getKVValue } from '~/server/utils/getKV'

export default defineEventHandler(async (event) => {
  const { key } = getRouterParams(event)

  const context = event.context
  const value = await getKVValue(key, context)


 if (!value) {
    return sendError(event, createError({ statusCode: 404, statusMessage: 'Not found'}))
 }

  const jsonValue = JSON.parse(value)

  return jsonValue
})