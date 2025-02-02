
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

import { rejects } from "assert";
import { v2 as cloudinary, UploadStream } from "cloudinary"
import { NextRequest, NextResponse } from "next/server";


const prisma = new PrismaClient()

cloudinary.config({
    cloud_name: process.env.Next_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any
}

export async function POST(request: NextRequest) {



    try {

        // todo check user

        const { userId }: any = auth()

        // const user =  await prisma.user.findUnique({
        //     where:{id:userId}
        // })

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (
            !process.env.Next_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET

        ) {
            return NextResponse.json({ error: "Cloudinary credentials not found" }, { status: 500 })
        }


        // if (!user) {
        //     return NextResponse.json(
        //         { error: "User not found" },
        //         { status: 403 }
        //     )
        // }


        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title  = formData.get('title') as string ;
        const description = formData.get('description') as string;
        const originalSize = formData.get('originalSize') as string;



        if (!file) {
            return NextResponse.json({
                error: "file not found"
            }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                    resource_type:"video",
                        folder: 'video-uploads',
                        transformation:[
                            {quality: 'auto', fetch_format:'mp4'}
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result as CloudinaryUploadResult)
                    }
                )
                uploadStream.end(buffer);
            }
        )

        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            }
        })

       return NextResponse.json(video);
    } catch (error) {
        console.log('upload video failed ', error);
        return NextResponse.json({
            error: "Upload video failed"
        }, { status: 500 })

    }finally{
        await prisma.$disconnect();
    }

}
