import { auth, clerkMiddleware,createRouteMatcher } from '@clerk/nextjs/server'
import { url } from 'inspector'
import { NextResponse } from 'next/server'


const isPublicRoute = createRouteMatcher([
    '/sign-in',
    '/sign-up',
    '/',
    '/home',
    '/social-share'
])


const isPublicApiRoute = createRouteMatcher([
    '/api/videos'
])

export default clerkMiddleware((auth,req)=>{
    const {userId}:any = auth()
    const currentUrl = new URL(req.url);
    const  isAccessingDashboard=currentUrl.pathname==='/home'
    const isApiRequest = currentUrl.pathname.startsWith('/api');

    // If user is logged in and accesing a public router but not the dashboard
    if(userId && isPublicApiRoute(req) && !isAccessingDashboard){
        return NextResponse.redirect(new URL ('/home', req.url))
    }

    // Not Logged In
    if(!userId){

        // if user is not logged in and trying to access protected route return to signin page directyly
        if(!isPublicApiRoute(req) && !isPublicRoute(req)){
            return NextResponse.redirect(new URL('/sign-in', req.url));
        }

        // If the requested is protected by api and the user is not logged in

        if(!isApiRequest && !isPublicApiRoute){
            return NextResponse.redirect(new URL("/sign-in"))
        }
    }

})




export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}