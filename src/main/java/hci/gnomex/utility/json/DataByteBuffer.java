package  hci.gnomex.utility.json;

/**
 */
public class DataByteBuffer {

    public byte[] data   = null;
    public int    length = 0;


    public DataByteBuffer() {
    }

    public DataByteBuffer(byte[] data) {
        this.data = data;
    }

    public DataByteBuffer(int capacity) {
        this.data = new byte[capacity];
    }
}
