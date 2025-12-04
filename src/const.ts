
export const production =true
export const DOMAIN = production?"https://xavren-server.onrender.com":"http://172.20.10.3:5002";
// export const DOMAIN = "http://172.20.10.2:5002";
export const DOMAINAPI = DOMAIN +"/api";
export const LOGINWITHPHRASE = DOMAINAPI +"/auth/login-secret-phrase"
export const UPDATEENVURL = DOMAINAPI +"/projects/env/update"
export const ADDENVURL = DOMAINAPI +"/projects/env/add"
export const UPGRADEVERSIONURL = DOMAINAPI +"/projects/upgrade-pkey-version"
export const GETPROJECTBYIDURL = DOMAINAPI +"/projects/one"
export const FETCHENVURL = DOMAINAPI +"/projects/env"
export const GETSIGNEDKEYURL =DOMAINAPI+"/auth/signed-key_"
export const APPNAME =  "xavren"
export const PRIVATEKEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC9wRqW73K4QsVc\nUcMYMgyeyXazbo/T3nfP1+NbdkPWO3xoskCHkbZPDSQWF6eQO1cZe/gZC4ZFKZM1\ncDasuq2Nd/mu3EQqnko8v3r6sguGeshbQ3CKshYKlEuCvdDws8ZItnMXbMWqI/dN\nD09yUrw8TUaHER+v8fR0HM8/2HwM9hB7jWLlesbw/ghwshpKbq4dK41sMjvqPCQ+\nS2YYliXGkGUcvdRKkd3lH9KBDlkFEyAM6kUGgSv0amaD+YPVUCGrVAKnK278HrHf\nskM/BW0n7bXmTFG4w8RU2uwImKbys8mN7EbHYJGS7UZ5exyiAM82XU1/TcASVvUe\nyvAFuMIDAgMBAAECggEAMMx2YBaYNBbH1qQYPiKw6Cz7X82xI1V1DniAucbCT1fg\n+LPOsI6iidXhT+UpbIg2MBGXjilOkH7OotGG3gjsFROjnHp89VDb2p+Lquka2ay9\n1eqUCLcfv/y/JpJWJ3C0L4LsOjv44XZ6ZNDpJ4drbT6aQqX+tirNKQc3rT2pOVOk\n1QqodOAElzH+R6AHRQtljrDiyx9iJRnz+7Y3oX1hxZIn/rGpyqIZt6Nc4Rq5pQ8G\n/N9nToVISg9PHierFJ6RoeNM4T6VOxDSK3fenjqGBllA1ZQgO2U5ayl8qnFEIKYy\n3nzey2y/bot4kktmOlv1mP0BSjqFiU3B/sun6KNscQKBgQDuoi+Ogqc9mGh0MlbS\nOvjpmHHwoo3AMzLe94yOD8Ya+0LK29uER8PDtqzq+fAzNpamMExIJR/y/OCafuyR\nycGaoQ5YHDhEjz9RDPZprBB16EGs2SplxPysIdr03cM+cy4pOof6JfqeY0DXony8\n8hLHL3yrrK2Wts0e1OOQYfSCzwKBgQDLkEiSgIeB0vh4HmyNpC7qbfb8JVKAsJBo\nhULwlbFmxBL6gpkXxpixA8+z9+ORBAiNAHU3kqj234uaDh8vKZN5sm7/7bf7KV7j\nehauMSapSLxcbYJQ0PjfYq4wZs1J2POS08aGKba2pwwrT9cGj2wDB8eYkaYWxMAD\nPZNOMq1qjQKBgF2iL8zYQSzvB1VIhz6YOyDVWyfTcJFQxY4tTe5UDCR8IHoeiGTA\nD/VUUUcl6PT/X184JkZMotuiE7MrSEHwC1JUDZ/O+tkT6AEyd+GAzTimeFaNI5Cp\nGYelBRf9h+WSJjOxLredfVf2k/PIYu90gJ+9Z0qpR7eSZKvLVrtJZDqLAoGATk3w\nPLrIZX48Kii55Tp0+aTXT2Mj+3Dv++TXPSi4Fynxiv/V2DmC3wTyTu5aUZxVlbfJ\nX1lBOcYAM4CfKks5+aRT4osVLL5bS/HY66TolFHwczWE3YWlVnjlPKUu7utPtvlT\n8qP1LwnPOpH5ywI8sGW7t8q/Mx74Jcb39Sq1XrkCgYBlsDdKNNCHZzh0Oc24G9SK\nQYIv0Nd0HJDHXXZaaQTZJ+RudZ+mJSRC/8M+QVCYF9XbJBgLlC+3Q/hJ4QyOEPvv\nvxybfLkFWZwL32qiuyYzhuQek+MMMy/0vlYNYYNvbN4Dixm1Gp9lb+TD9Nr1ejjT\nKDXPls/bDosPxNXGY9arvA==\n-----END PRIVATE KEY-----"