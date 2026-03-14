import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, budgetTarget, latitude, longitude, agencyId } = body;

        if (!title || !description || !latitude || !longitude || !agencyId) {
            return NextResponse.json(
                { error: "Missing required fields: title, description, latitude, longitude, and agencyId are required." },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const newProject = await tx.project.create({
                data: {
                    title,
                    description,
                    budgetTarget,
                    latitude,
                    longitude,
                    agencyId,
                },
            });

            await tx.projectUpdate.create({
                data: {
                    title: "Project Created",
                    description: `Project "${title}" has been created.`,
                    projectId: newProject.id,
                },
            });

            return newProject;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Failed to create project." },
            { status: 500 }
        );
    }
}