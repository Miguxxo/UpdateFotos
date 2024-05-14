import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Image, FlatList, ScrollView, Text } from 'react-native';
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage, firebd } from "../firebase";
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import * as ImagePicker from "expo-image-picker";

export default function Home() {
    const [image, setImage] = useState("");
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firebd, "files"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setFiles((prevFiles) => [...prevFiles, change.doc.data()]);
                }
            });
        });

        return () => unsubscribe();
    }, []);

    async function uploadImage(uri, fileType) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, new Date().toISOString());
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
            "state_changed",
            null,
            (error) => {
                console.error(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await saveRecord(fileType, downloadURL, new Date().toISOString());
                setImage("");
            }
        );
    }

    async function saveRecord(fileType, url, createdAt) {
        try {
            await addDoc(collection(firebd, "files"), {
                fileType,
                url,
                createdAt,
            });
        } catch (e) {
            console.log(e);
        }
    }

    async function pickImage() {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const { uri } = result.assets[0];
            setImage(uri);
            await uploadImage(uri, "image");
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8, height: '100%', width: '100%' }}>
                <Text style={{ textAlign: 'center' }}>
                    Arquivos Enviados
                </Text>
                <FlatList
                    data={files}
                    keyExtractor={(item) => item.url}
                    renderItem={({ item }) => {
                        if (item.fileType === "image") {
                            return (
                                <Image
                                    source={{ uri: item.url }}
                                    style={{ width: 350, height: 350, borderRadius: 20, margin: 5 }}
                                />
                            );
                        }
                        return null;
                    }}
                    numColumns={2}
                />
                <TouchableOpacity
                    onPress={pickImage}
                    style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 20, padding: 50, backgroundColor: 'lightblue', marginTop: 10 }}
                >
                    <Text>Selecionar Imagens</Text>
                </TouchableOpacity>
        </View>
    );
}
