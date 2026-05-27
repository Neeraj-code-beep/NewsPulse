import React from 'react'
import { Outlet } from 'react-router-dom'

// eslint-disable-next-line react/prop-types
function ProtectedRoutes({children}) {
  

  return children ? children : <Outlet/>
}

export default ProtectedRoutes
