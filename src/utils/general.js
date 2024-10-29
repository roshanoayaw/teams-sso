export function toQueryString(queryParams) {
  let encodedQueryParams = [];
  for (let key in queryParams) {
    encodedQueryParams.push(key + "=" + encodeURIComponent(queryParams[key]));
  }
  return encodedQueryParams.join("&");
}
