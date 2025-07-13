import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, addDoc, getDocs, where, query, doc, getDoc, updateDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const teacherWelcome = document.getElementById('teacher-welcome');
const scheduleForm = document.getElementById('schedule-form');
const slotsList = document.getElementById('slots-list');
const pendingAppointmentsList = document.getElementById('pending-appointments-list');
const confirmedAppointmentsList = document.getElementById('confirmed-appointments-list');
const logoutBtn = document.getElementById('logout-btn');
const messageBox = document.getElementById('message-box');

let currentTeacher = null;

// Protect the page and load data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'teacher') {
            currentTeacher = { id: user.uid, ...userDoc.data() };
            teacherWelcome.textContent = `Welcome, ${currentTeacher.name}`;
            loadAvailability();
            loadAppointments();
        } else {
            // Not a teacher, redirect
            window.location.href = 'index.html';
        }
    } else {
        // No user is signed in. Redirect
        window.location.href = 'index.html';
    }
});

// Add availability slot
scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('schedule-date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    try {
        await addDoc(collection(db, 'availability'), {
            teacherId: currentTeacher.id,
            teacherName: currentTeacher.name,
            date,
            startTime,
            endTime,
            booked: false
        });
        showMessage('Availability slot added!', 'success');
        scheduleForm.reset();
        loadAvailability();
    } catch (error) {
        showMessage('Error adding slot.', 'error');
    }
});

// Load availability slots
async function loadAvailability() {
    if (!currentTeacher) return;
    slotsList.innerHTML = '<li>Loading...</li>';
    const q = query(collection(db, "availability"), where("teacherId", "==", currentTeacher.id), orderBy("date"));
    const querySnapshot = await getDocs(q);

    slotsList.innerHTML = '';
    if (querySnapshot.empty) {
        slotsList.innerHTML = '<li>You have not set any available slots.</li>';
        return;
    }

    querySnapshot.forEach(doc => {
        const slot = doc.data();
        const li = document.createElement('li');
        li.innerHTML = `<span>${slot.date} from ${slot.startTime} to ${slot.endTime}</span>`;
        if (slot.booked) {
             li.innerHTML += ` <span class="status-booked">Booked</span>`;
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn-small btn-danger';
        deleteBtn.onclick = () => deleteSlot(doc.id);

        li.appendChild(deleteBtn);
        slotsList.appendChild(li);
    });
}

// Delete an availability slot
async function deleteSlot(slotId) {
    if (confirm('Are you sure you want to delete this slot?')) {
        await deleteDoc(doc(db, 'availability', slotId));
        showMessage('Slot deleted.', 'success');
        loadAvailability();
    }
}


// Load all appointments (pending and confirmed)
async function loadAppointments() {
    if (!currentTeacher) return;
    pendingAppointmentsList.innerHTML = '<li>Loading...</li>';
    confirmedAppointmentsList.innerHTML = '<li>Loading...</li>';

    const q = query(collection(db, "appointments"), where("teacherId", "==", currentTeacher.id), orderBy("date"));
    const querySnapshot = await getDocs(q);

    pendingAppointmentsList.innerHTML = '';
    confirmedAppointmentsList.innerHTML = '';

    let pendingCount = 0;
    let confirmedCount = 0;

    for (const docSnap of querySnapshot.docs) {
        const appointment = docSnap.data();
        const studentDocRef = doc(db, "users", appointment.studentId);
        const studentDoc = await getDoc(studentDocRef);
        const studentName = studentDoc.exists() ? studentDoc.data().name : 'Unknown Student';

        const li = document.createElement('li');
        li.innerHTML = `<span>${appointment.date} at ${appointment.time} with <b>${studentName}</b><br><i>Purpose: ${appointment.purpose}</i></span>`;

        if (appointment.status === 'pending') {
            const approveBtn = document.createElement('button');
            approveBtn.textContent = 'Approve';
            approveBtn.className = 'btn-small';
            approveBtn.onclick = () => updateAppointmentStatus(docSnap.id, 'confirmed', appointment.availabilitySlotId);

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'btn-small btn-danger';
            cancelBtn.onclick = () => updateAppointmentStatus(docSnap.id, 'cancelled');

            li.appendChild(approveBtn);
            li.appendChild(cancelBtn);
            pendingAppointmentsList.appendChild(li);
            pendingCount++;
        } else if (appointment.status === 'confirmed') {
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'btn-small btn-danger';
            cancelBtn.onclick = () => updateAppointmentStatus(docSnap.id, 'cancelled', appointment.availabilitySlotId);

            li.appendChild(cancelBtn);
            confirmedAppointmentsList.appendChild(li);
            confirmedCount++;
        }
    }

    if (pendingCount === 0) {
        pendingAppointmentsList.innerHTML = '<li>No pending appointment requests.</li>';
    }
    if (confirmedCount === 0) {
        confirmedAppointmentsList.innerHTML = '<li>No confirmed appointments.</li>';
    }
}

// Approve or cancel an appointment
async function updateAppointmentStatus(appointmentId, status, slotId = null) {
    const appointmentRef = doc(db, "appointments", appointmentId);
    try {
        await updateDoc(appointmentRef, { status: status });

        // If approving, mark the availability slot as booked
        if (status === 'confirmed' && slotId) {
            const slotRef = doc(db, 'availability', slotId);
            await updateDoc(slotRef, { booked: true });
        }
        
        // If cancelling a confirmed appointment, free up the slot
        if (status === 'cancelled' && slotId) {
            const slotRef = doc(db, 'availability', slotId);
            await updateDoc(slotRef, { booked: false });
        }
        
        showMessage(`Appointment ${status}.`, 'success');
        loadAppointments();
        loadAvailability();
    } catch (error) {
        showMessage('Error updating appointment.', 'error');
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