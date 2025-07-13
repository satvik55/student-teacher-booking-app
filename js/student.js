import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, addDoc, getDocs, where, query, doc, getDoc, Timestamp, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const studentWelcome = document.getElementById('student-welcome');
const searchTeacherForm = document.getElementById('search-teacher-form');
const teacherResultsList = document.getElementById('teacher-results-list');
const bookingSection = document.getElementById('booking-section');
const bookingHeader = document.getElementById('booking-header');
const availabilityList = document.getElementById('availability-list');
const myAppointmentsList = document.getElementById('my-appointments-list');
const logoutBtn = document.getElementById('logout-btn');
const messageBox = document.getElementById('message-box');

let currentStudent = null;

// Protect the page and load data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'student' && userDoc.data().approved) {
            currentStudent = { id: user.uid, ...userDoc.data() };
            studentWelcome.textContent = `Welcome, ${currentStudent.name}`;
            loadMyAppointments();
        } else if (userDoc.exists() && !userDoc.data().approved) {
             showMessage('Your account is still pending approval.', 'error');
             setTimeout(() => auth.signOut(), 3000);
        }
        else {
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
});

// Search for teachers
searchTeacherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = document.getElementById('teacher-search-input').value.toLowerCase();
    teacherResultsList.innerHTML = '<li>Searching...</li>';

    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const querySnapshot = await getDocs(q);

    teacherResultsList.innerHTML = '';
    let resultsFound = false;
    querySnapshot.forEach((doc) => {
        const teacher = { id: doc.id, ...doc.data() };
        const name = teacher.name.toLowerCase();
        const subject = teacher.subject.toLowerCase();
        const department = teacher.department.toLowerCase();

        if (name.includes(searchTerm) || subject.includes(searchTerm) || department.includes(searchTerm)) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${teacher.name} - ${teacher.subject}</span>`;
            
            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View Slots';
            viewBtn.className = 'btn-small';
            viewBtn.onclick = () => loadTeacherAvailability(teacher);

            li.appendChild(viewBtn);
            teacherResultsList.appendChild(li);
            resultsFound = true;
        }
    });

    if (!resultsFound) {
        teacherResultsList.innerHTML = '<li>No teachers found matching your search.</li>';
    }
});

// Load a specific teacher's available slots
async function loadTeacherAvailability(teacher) {
    bookingHeader.textContent = `Available Slots for ${teacher.name}`;
    bookingSection.classList.remove('hidden');
    availabilityList.innerHTML = '<li>Loading slots...</li>';

    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "availability"), 
        where("teacherId", "==", teacher.id), 
        where("booked", "==", false),
        where("date", ">=", today),
        orderBy("date"));

    const querySnapshot = await getDocs(q);
    
    availabilityList.innerHTML = '';
    if (querySnapshot.empty) {
        availabilityList.innerHTML = '<li>This teacher has no available slots.</li>';
        return;
    }

    querySnapshot.forEach((doc) => {
        const slot = {id: doc.id, ...doc.data()};
        const li = document.createElement('li');
        li.innerHTML = `<span>${slot.date} from ${slot.startTime} to ${slot.endTime}</span>`;
        
        const bookBtn = document.createElement('button');
        bookBtn.textContent = 'Book';
        bookBtn.className = 'btn-small';
        bookBtn.onclick = () => bookAppointment(slot);

        li.appendChild(bookBtn);
        availabilityList.appendChild(li);
    });
}

// Book an appointment
async function bookAppointment(slot) {
    const purpose = prompt("What is the purpose of this appointment?");
    if (!purpose) {
        showMessage('Booking cancelled. Purpose is required.', 'error');
        return;
    }

    try {
        await addDoc(collection(db, 'appointments'), {
            studentId: currentStudent.id,
            teacherId: slot.teacherId,
            availabilitySlotId: slot.id,
            date: slot.date,
            time: slot.startTime,
            purpose: purpose,
            status: 'pending' // Status can be 'pending', 'confirmed', 'cancelled'
        });
        showMessage('Appointment request sent successfully!', 'success');
        bookingSection.classList.add('hidden');
        loadMyAppointments();
    } catch (error) {
        showMessage('Failed to book appointment.', 'error');
    }
}

// Load the student's own appointments
async function loadMyAppointments() {
    myAppointmentsList.innerHTML = '<li>Loading...</li>';
    const q = query(collection(db, "appointments"), where("studentId", "==", currentStudent.id), orderBy("date"));
    const querySnapshot = await getDocs(q);

    myAppointmentsList.innerHTML = '';
    if (querySnapshot.empty) {
        myAppointmentsList.innerHTML = "<li>You don't have any appointments.</li>";
        return;
    }

    for (const docSnap of querySnapshot.docs) {
        const appointment = docSnap.data();
        const teacherDoc = await getDoc(doc(db, "users", appointment.teacherId));
        const teacherName = teacherDoc.exists() ? teacherDoc.data().name : 'Unknown Teacher';
        
        const li = document.createElement('li');
        const statusClass = `status-${appointment.status}`;
        li.innerHTML = `<span>Appointment with <b>${teacherName}</b> on ${appointment.date} at ${appointment.time}</span>
                        <span class="status-badge ${statusClass}">${appointment.status}</span>`;
        myAppointmentsList.appendChild(li);
    }
}


// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
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