import rootPath from 'app-root-path';
import fs from 'fs-extra';
import supertest from 'supertest';
import { InstanceType } from 'typegoose';

import { Mesh, MeshModel } from '../routes/meshes/meshes.model';
import { FieldName, MeshStorage } from '../routes/meshes/meshes.storage';
import { GoogleAuthData } from '../routes/users/users.auth';
import { User, UserModel } from '../routes/users/users.model';

/** A test user */
export interface TestUser {
    /** The test user's fake auth data */
    auth: GoogleAuthData;

    /** The test user's id token, which is just a strigified version of the auth data */
    idToken: string;
}

/** A collection of test users */
export interface TestUserCollection {
    /** The first test user */
    one: TestUser;

    /** The second test user */
    two: TestUser;
}

/** Data for a mesh */
export interface TestMesh {
    /** The name of the mesh */
    name: string;

    /** A short description of the mesh */
    shortDesc: string;

    /** A long description of the mesh */
    longDesc: string;

    /** Path to test mesh */
    file: Express.Multer.File;
}

/** An enum of files in the test collateral dir */
export enum TestCollateral {
    CUBEFBX = 'cube.fbx',
}

/** Creates a test mesh file */
export const createTestFile = (file: TestCollateral): Express.Multer.File => {
    const filename = file.toString();
    const path = `${rootPath}/testCollateral/${filename}`;
    return <Express.Multer.File><any>{
        buffer: fs.readFileSync(path),
        mimetype: 'text',
        originalname: filename,
        path,
    };
};

/** A collection of test meshes */
export interface TestMeshCollection {
    /** The first test mesh */
    one: TestMesh;

    /** The second test mesh */
    two: TestMesh;
}

/** A collection of test data used during tests */
export interface TestData {
    /** A collection of test users */
    users: TestUserCollection;

    /** A collectino of test meshes */
    meshes: TestMeshCollection;


    /** An invalid database id */
    invalidId: string;
}

/** Auth data for the first test user */
const test1UserAuthData: GoogleAuthData = {
    idToken: 'abcdefg', // Fake id token
    id: '123456789', // Fake google id
    name: 'Test User 1', // user's name
    email: 'test1@test.com', // user's email
};

/** Auth data for the first test user */
const test2UserAuthData: GoogleAuthData = {
    idToken: 'hijklmnop', // Fake id token
    id: '987654321', // Fake google id
    name: 'Test User 2', // user's name
    email: 'test2@test.com', // user's email
};

/** A collection of test data for use in automation */
export const testData: TestData = {
    users: {
        one: {
            auth: test1UserAuthData,
            idToken: JSON.stringify(test1UserAuthData),
        },

        two: {
            auth: test2UserAuthData,
            idToken: JSON.stringify(test2UserAuthData),
        },
    },

    meshes: {
        one: {
            name: 'Test Mesh 1',
            shortDesc: 'This is a short description',
            longDesc: 'This is a really, really, really long description that\'s not actually all that long',
            file: createTestFile(TestCollateral.CUBEFBX),
        },

        two: {
            name: 'Test Mesh 2',
            shortDesc: undefined,
            longDesc: undefined,
            file: createTestFile(TestCollateral.CUBEFBX),
        }
    },

    invalidId: '5b52594de29d171ae09642da',
};

// Create a super test  class override
// so we can add custom functions
export interface MedModeSuperTest extends supertest.Test {
    /** attaches a test mesh to the request */
    attachTestMesh(testMesh: TestMesh): MedModeSuperTest;
}

// Get the interface for requests so we can extend it
const requestClass = (<any>supertest).Test;

/** attaches a test mesh to the request */
requestClass.prototype.attachTestMesh = function (testMesh: TestMesh): MedModeSuperTest {
    if (testMesh.name != undefined && testMesh.name != undefined) {
        this.field('name', testMesh.name);
    }

    if (testMesh.shortDesc != undefined && testMesh.shortDesc != undefined) {
        this.field('shortDesc', testMesh.shortDesc);
    }

    if (testMesh.longDesc != undefined && testMesh.longDesc != undefined) {
        this.field('longDesc', testMesh.longDesc);
    }

    if (testMesh.file) {
        this.attach(FieldName, testMesh.file.path);
    }

    return this;
};

/** Tests should import this reqesust to get extensions through intellidense */
export const request = (app: any): supertest.SuperTest<MedModeSuperTest> => {
    return <supertest.SuperTest<MedModeSuperTest>><any>supertest(app);
};

/** Creates a test user based on the specified token values */
export const createUser = (testUser: TestUser): Promise<InstanceType<User>> => {
    return UserModel.createUser(testUser.auth.id, testUser.auth.name, testUser.auth.email);
};

/** Creates a test mesh based on the specified data */
export const createMesh = async (owner: InstanceType<User>, testMesh: TestMesh): Promise<InstanceType<Mesh>> => {
    const files = <Express.Multer.File[]>[];
    files.push(<Express.Multer.File><any>(testMesh.file));

    return MeshModel.createMesh(
        owner,
        testMesh.name,
        testMesh.shortDesc,
        testMesh.longDesc,
        files
    );
};

