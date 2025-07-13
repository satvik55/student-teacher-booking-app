import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, addDoc, setDoc, doc, getDocs, where, query, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const addTeacherForm = document.getElementById('add-teacher-form');
const pendingStudentsList = document.getElementById('pending-students-list');
const teachersList = document.getElementById('teachers-list');
const logoutBtn = document.getElementById('logout-btn');
const messageBox = document.getElementById('message-box');

// Protect the page and fetch data on load
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in.
        loadPendingStudents();
        loadTeachers();
    } else {
        // No user is signed in. Redirect to login page.
        window.location.href = 'index.html';
    }
});

// Add Teacher
addTeacherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('teacher-name').value;
    const department = document.getElementById('teacher-department').value;
    const subject = document.getElementById('teacher-subject').value;
    const email = document.getElementById('teacher-email').value;
    const password = document.getElementById('teacher-password').value;

    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Add teacher details to Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            department: department,
            subject: subject,
            email: email,
            role: 'teacher'
        });
        
        showMessage('Teacher added successfully!', 'success');
        addTeacherForm.reset();
        loadTeachers(); // Refresh the list
    } catch (error) {
        showMessage(`Error adding teacher: ${error.message}`, 'error');
    }
});

// Load and display pending students
async function loadPendingStudents() {
    pendingStudentsList.innerHTML = '<li>Loading...</li>';
    const q = query(collection(db, "users"), where("role", "==", "student"), where("approved", "==", false));
    const querySnapshot = await getDocs(q);
    
    pendingStudentsList.innerHTML = ''; // Clear list
    if (querySnapshot.empty) {
        pendingStudentsList.innerHTML = '<li>No pending student approvals.</li>';
        return;
    }

    querySnapshot.forEach((doc) => {
        const student = doc.data();
        const li = document.createElement('li');
        li.innerHTML = `<span>${student.name} (${student.email})</span>`;
        
        const approveBtn = document.createElement('button');
        approveBtn.textContent = 'Approve';
        approveBtn.className = 'btn-small';
        approveBtn.onclick = () => approveStudent(doc.id);

        li.appendChild(approveBtn);
        pendingStudentsList.appendChild(li);
    });
}

// Approve a student
async function approveStudent(studentId) {
    const studentRef = doc(db, "users", studentId);
    try {
        await updateDoc(studentRef, {
            approved: true
        });
        showMessage('Student approved successfully!', 'success');
        loadPendingStudents(); // Refresh the list
    } catch (error) {
        showMessage('Error approving student.', 'error');
    }
}

// Load and display all teachers
async function loadTeachers() {
    teachersList.innerHTML = '<li>Loading...</li>';
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const querySnapshot = await getDocs(q);

    teachersList.innerHTML = ''; // Clear list
    if (querySnapshot.empty) {
        teachersList.innerHTML = '<li>No teachers found.</li>';
        return;
    }
    
    querySnapshot.forEach((doc) => {
        const teacher = doc.data();
        const li = document.createElement('li');
        li.innerHTML = `<span>${teacher.name} - ${teacher.subject} (${teacher.department})</span>`;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn-small btn-danger';
        // Note: Deleting a user from Firestore does not delete them from Auth.
        // A more robust solution would use Firebase Functions to handle this.
        deleteBtn.onclick = () => deleteTeacher(doc.id);
        
        li.appendChild(deleteBtn);
        teachersList.appendChild(li);
    });
}

// Delete a teacher record from Firestore
async function deleteTeacher(teacherId) {
    if (confirm('Are you sure you want to delete this teacher? This cannot be undone.')) {
        try {
            await deleteDoc(doc(db, "users", teacherId));
            showMessage('Teacher deleted successfully.', 'success');
            loadTeachers(); // Refresh list
        } catch(error) {
            showMessage('Error deleting teacher.', 'error');
        }
    }
}


// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        showMessage('Logout failed.', 'error');
    });
});

// Utility to show messages
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}